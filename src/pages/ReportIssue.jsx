import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Loader } from '../components/Loader';
import {
  MapPin,
  Camera,
  Sparkles,
  CheckCircle,
  WifiOff,
} from 'lucide-react';
import { issuesAPI } from '../services/api';
import { addIssueToQueue, getPendingCount } from '../utils/indexedDB';
import { uploadImageToSupabase } from '../utils/supabaseImageUpload';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { toast } from 'sonner';

export const ReportIssue = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predictingPriority, setPredictingPriority] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageFile: null,
    imagePreview: null,
    location: null,
    priority: '',
  });

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }

    // Check pending count
    updatePendingCount();

    // Listen for online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updatePendingCount = async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageFile: file,
          imagePreview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const predictPriority = async () => {
    if (isOffline) {
      toast.error('Priority prediction requires an internet connection');
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      toast.error('Please provide a detailed description first');
      return;
    }

    setPredictingPriority(true);

    try {
      // Initialize Gemini AI
      const genAI = new GoogleGenerativeAI(
        import.meta.env.VITE_GEMINI_API_KEY 
      );
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `Analyze this civic issue report and determine its priority level (Low, Medium, High, or Critical).

Issue Title: ${formData.title}
Issue Description: ${formData.description}

Based on factors like:
- Public safety impact
- Severity of the issue
- Urgency of resolution needed
- Number of people affected

Respond with ONLY one word: Low, Medium, High, or Critical`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const priority = response.text().trim();

      // Validate and set priority
      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      const normalizedPriority = validPriorities.find(
        (p) => p.toLowerCase() === priority.toLowerCase()
      );

      if (normalizedPriority) {
        setFormData((prev) => ({ ...prev, priority: normalizedPriority }));
        toast.success(`Priority predicted: ${normalizedPriority}`);
        console.log(`<----------------${normalizedPriority}----------------------->`)
      } else {
        setFormData((prev) => ({ ...prev, priority: 'Medium' }));
        toast.info('AI returned an unexpected result. Priority set to Medium (default).');
        console.log(`<----------------Medium----------------------->`)
      }
    } catch (error) {
      console.error('Error predicting priority:', error);
      toast.error('Could not predict priority. Please try again.');
    } finally {
      setPredictingPriority(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isOffline && !formData.priority) {
      toast.error('Please predict priority with AI before submitting');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image to Supabase if one is selected and online
      if (formData.imageFile && !isOffline) {
        try {
          toast.loading('Uploading image...');
          const uploadResult = await uploadImageToSupabase(formData.imageFile, user.uid);
          imageUrl = uploadResult.url;
          toast.dismiss();
        } catch (error) {
          toast.error(`Failed to upload image: ${error.message}`);
          setLoading(false);
          return;
        }
      }

      const issueData = {
        title: formData.title,
        description: formData.description,
        imageUrl: imageUrl, // Store the URL instead of base64
        location: formData.location,
        priority: formData.priority || 'Medium',
        status: 'pending',
      };

      if (isOffline) {
        // For offline mode, convert image to base64 and store locally
        if (formData.imageFile) {
          const reader = new FileReader();
          reader.onload = async () => {
            const offlineIssueData = {
              ...issueData,
              imageUrl: reader.result, // Store base64 for offline - will be uploaded when online
            };
            await addIssueToQueue(offlineIssueData);
            await updatePendingCount();
            toast.success('Issue saved offline. Will sync when online.');

            // Reset form
            setFormData({
              title: '',
              description: '',
              imageFile: null,
              imagePreview: null,
              location: formData.location,
              priority: '',
            });
            setLoading(false);
          };
          reader.readAsDataURL(formData.imageFile);
          return;
        } else {
          await addIssueToQueue(issueData);
          await updatePendingCount();
          toast.success('Issue saved offline. Will sync when online.');

          // Reset form
          setFormData({
            title: '',
            description: '',
            imageFile: null,
            imagePreview: null,
            location: formData.location,
            priority: '',
          });
        }
      } else {
        // Submit to API
        await issuesAPI.createIssue(issueData);
        toast.success('Issue reported successfully!');
        navigate('/my-issues');
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error('Failed to submit issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64 pt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isOffline && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
              <WifiOff className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">Offline Mode</p>
                <p className="text-sm text-yellow-700 mt-1">
                  You're offline. Issues will be saved locally and synced when connection is restored.
                  {pendingCount > 0 && ` ${pendingCount} issue(s) pending sync.`}
                </p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Report an Issue</h1>
            <p className="text-muted-foreground mt-1">Help improve your community</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Issue Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Broken streetlight on Main Street"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the issue in detail..."
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Priority (AI)
                  </label>
                  <button
                    type="button"
                    onClick={predictPriority}
                    disabled={isOffline || predictingPriority || !formData.description}
                    className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {predictingPriority ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>AI Predict</span>
                      </>
                    )}
                  </button>
                </div>

                {formData.priority && (
                  <p className="mt-2 text-sm text-muted-foreground flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                    Priority set to: <span className="font-medium ml-1">{formData.priority}</span>
                  </p>
                )}

                {!formData.priority && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {isOffline ? (
                      <>Go online to run <span className="font-medium">AI Predict</span> for priority.</>
                    ) : (
                      <>Click <span className="font-medium">AI Predict</span> to determine the priority.</>
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Upload Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-lg hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    {formData.imagePreview ? (
                      <div className="relative">
                        <img
                          src={formData.imagePreview}
                          alt="Preview"
                          className="mx-auto h-48 w-auto rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              image: null,
                              imagePreview: null,
                            }))
                          }
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground">
                          <label className="relative cursor-pointer bg-card rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location
                </label>
                <div className="flex items-center space-x-2 p-3 bg-accent rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  {formData.location ? (
                    <span className="text-sm text-foreground">
                      {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Detecting location...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Submitting...
                  </div>
                ) : (
                  'Submit Issue'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
