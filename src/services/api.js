import axios from "axios";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Firebase token
api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 🚨 handle 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const auth = getAuth();

    if (error.response?.status === 401) {
      await auth.signOut();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

const db = getFirestore();

const toIsoString = (value) => {
  if (!value) return value;
  if (typeof value === "string") return value;
  if (typeof value === "number") return new Date(value).toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  if (typeof value?.seconds === "number") return new Date(value.seconds * 1000).toISOString();
  return value;
};

const normalizeIssue = (id, data) => {
  const timeline = Array.isArray(data.timeline)
    ? data.timeline
        .map((event) => ({ ...event, date: toIsoString(event?.date) }))
        .filter((event, index, self) =>
          index ===
          self.findIndex(
            (item) =>
              item.event === event.event &&
              item.description === event.description &&
              item.date === event.date
          )
        )
    : [];

  return {
    id,
    ...data,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
    assignedAt: toIsoString(data.assignedAt),
    completedAt: toIsoString(data.completedAt),
    timeline,
  };
};

export const issuesAPI = {
  listAllIssues: async ({ limit = 250 } = {}) => {
    const q = query(collection(db, "issues"), orderBy("createdAt", "desc"), fsLimit(limit));
    const snap = await getDocs(q);
    return snap.docs.map((d) => normalizeIssue(d.id, d.data()));
  },

  listMyIssues: async (uid, { limit = 250 } = {}) => {
    const all = await issuesAPI.listAllIssues({ limit });
    return all.filter((issue) => issue.createdByUid === uid);
  },

  listAssignedIssues: async (uid, { limit = 250 } = {}) => {
    const all = await issuesAPI.listAllIssues({ limit });
    return all.filter((issue) => issue.assignedToUid === uid);
  },

  listEngineers: async () => {
    const q = query(collection(db, "users"), where("role", "==", "engineer"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getIssue: async (issueId) => {
    const ref = doc(db, "issues", issueId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeIssue(snap.id, snap.data());
  },

  createIssue: async (payload) => {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error("Not authenticated");

    const nowIso = new Date().toISOString();

    const issueDoc = {
      title: payload.title || "",
      description: payload.description || "",
      imageUrl: payload.imageUrl || null,
      location: payload.location || null,
      priority: payload.priority || "Medium",
      status: payload.status || "pending",
      remarks: payload.remarks || "",
      completionImage: payload.completionImage || null,

      createdByUid: firebaseUser.uid,
      reportedBy: {
        name: firebaseUser.displayName || payload.reportedBy?.name || "",
        email: firebaseUser.email || payload.reportedBy?.email || "",
      },

      assignedToUid: payload.assignedToUid || null,
      assignedTo: payload.assignedTo || null,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      timeline: [
        {
          date: nowIso,
          event: "Issue Reported",
          description: `Issue was reported by ${firebaseUser.displayName || "a user"}`,
        },
      ],
    };

    const ref = await addDoc(collection(db, "issues"), issueDoc);
    const saved = await getDoc(ref);
    return normalizeIssue(saved.id, saved.data());
  },

  updateIssue: async (issueId, payload) => {
    const ref = doc(db, "issues", issueId);
    const nowIso = new Date().toISOString();

    const current = await getDoc(ref);
    const existingTimeline = Array.isArray(current.data()?.timeline) ? current.data().timeline : [];

    const patch = { ...payload, updatedAt: serverTimestamp() };

    if (payload.status) {
      patch.timeline = [
        ...existingTimeline,
        {
          date: nowIso,
          event: "Status Updated",
          description: `Status changed to ${String(payload.status).replace("_", " ")}`,
        },
      ];

      if (payload.status === "completed") {
        patch.completedAt = serverTimestamp();
      }
    }

    await updateDoc(ref, patch);
    const snap = await getDoc(ref);
    return normalizeIssue(snap.id, snap.data());
  },

  assignIssue: async (issueId, engineerId) => {
    const issueRef = doc(db, "issues", issueId);
    const engineerRef = doc(db, "users", engineerId);
    const engineerSnap = await getDoc(engineerRef);
    const issueSnap = await getDoc(issueRef);
    const existingTimeline = Array.isArray(issueSnap.data()?.timeline) ? issueSnap.data().timeline : [];

    const engineer = engineerSnap.exists() ? engineerSnap.data() : {};
    const nowIso = new Date().toISOString();

    await updateDoc(issueRef, {
      assignedToUid: engineerId,
      assignedTo: {
        uid: engineerId,
        name: engineer?.name || "",
        email: engineer?.email || "",
      },
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      timeline: [
        ...existingTimeline,
        {
          date: nowIso,
          event: "Engineer Assigned",
          description: `Engineer ${engineer?.name || engineerId} was assigned to this issue`,
        },
      ],
    });

    const snap = await getDoc(issueRef);
    return normalizeIssue(snap.id, snap.data());
  },
};

export default api;
