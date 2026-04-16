# JANSEVA-INFRA
## Civic Issue Reporting System

A comprehensive web application for citizens to report civic issues, track their status, and for authorities to manage and resolve them. Built with modern web technologies for offline-first functionality, real-time updates, and AI-powered priority assessment.

## 🚀 Tech Stack

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,vite,firebase,supabase,tailwindcss" alt="Tech Stack" />
</p>

- **Frontend**: React 18, Vite
- **Authentication**: Firebase Auth
- **Database**:Firebase Firestore
- **Image Storage**: Supabase (PostgreSQL)
- **Offline Storage**: IndexedDB
- **Maps**: Leaflet with React-Leaflet
- **Routing**: React Router
- **State Management**: React Context
- **HTTP Client**: Axios
- **AI Integration**: Google Generative AI (Gemini) for issue priority prediction
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form

## 📋 Features

- **Role-based Access Control**: Citizen, Engineer, Supervisor roles
- **Offline-First**: Issues can be reported offline and synced when online
- **Real-time Updates**: Live status tracking
- **AI-Powered Priority**: Automatic priority assessment using Gemini AI
- **Interactive Maps**: Visualize issues on maps
- **Image Uploads**: Attach photos to issues

## 🏗️ Architecture Diagram

```mermaid
graph TB
    A[User] --> B[React Frontend]

    B --> C[Firebase Auth]
    B --> D[Firebase Firestore DB]
    B --> E[IndexedDB]
    B --> F[Leaflet Maps]
    B --> G[Gemini AI]
    B --> H[Supabase Storage]

    C --> I[Authentication]
    D --> J[Issues & Metadata Storage]
    H --> K[Image Storage]

    E --> L[Offline Queue]

    subgraph "Offline Flow"
        A --> M[Report Issue]
        M --> E
        E --> N[Sync Service]
        N --> D
        N --> H
    end

    subgraph "Online Flow"
        A --> O[View Issues]
        O --> D
        O --> F
    end
```

## 📸 Screenshots

### Landing Page
<img width="1407" height="856" alt="Screenshot 2026-04-14 224900" src="https://github.com/user-attachments/assets/d1795645-5dab-4e20-b5e2-d8b64a5e3092" />


### Login Page
<img width="884" height="912" alt="Screenshot 2026-04-14 224935" src="https://github.com/user-attachments/assets/74dbec76-4481-48f9-bfad-da0a3e8e1d69" />


### Dashboard
<img width="1875" height="913" alt="Screenshot 2026-04-14 225023" src="https://github.com/user-attachments/assets/b01525b2-0f0c-465c-8e2e-5d3d0b9b45d6" />


### Report Issue
<img width="1906" height="891" alt="Screenshot 2026-04-14 225054" src="https://github.com/user-attachments/assets/209dfd6d-04b5-46b5-ae23-5008650ee7d0" />

### My Issues
<img width="1887" height="789" alt="Screenshot 2026-04-14 225139" src="https://github.com/user-attachments/assets/b87b19bf-ae0a-467c-9fbf-d6306e315986" />


### Assigned Issues (Engineer)
<img width="1910" height="768" alt="Screenshot 2026-04-14 225250" src="https://github.com/user-attachments/assets/6b779b66-179b-4528-a22d-c81c146650f4" />


### Map View
<img width="1905" height="913" alt="Screenshot 2026-04-14 225533" src="https://github.com/user-attachments/assets/dcfff5e1-1908-4081-91ea-241d180f61e8" />


### Issue Details
<img width="1868" height="886" alt="Screenshot 2026-04-14 225342" src="https://github.com/user-attachments/assets/7286ed91-8d48-45c4-97a3-567e5eb06071" />


## 🔧 Prerequisites

- **Node.js** (LTS version 18+ recommended)
- **npm** 
- **Firebase Project** with Authentication and Storage enabled
- **Supabase Project** with Database and Storage configured
- **Google AI API Key** (for Gemini integration)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Civic Issue Reporting System"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the project root:

   ```bash
   # API Configuration
   VITE_API_BASE_URL=http://localhost:5000/api

   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

   # Supabase Configuration
   VITE_SUPABASE_URL=https://your_project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Configuration
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

## 🚀 Usage

### Development
```bash
npm run dev
```
Vite will start the development server at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Windows PowerShell Note
If npm scripts fail with "running scripts is disabled":
```bat
cmd /c npm install
cmd /c npm run dev
```

## 🔍 About Technologies

### Firebase
Firebase provides authentication services and cloud storage:
- **Authentication**: User login/signup with email/password
- **Storage**: Stores user and issues information
- **Analytics**: Usage tracking and insights

Configuration in `src/firebase/config.js` initializes the Firebase app with environment variables.

### Supabase
Supabase provides file storage facility:
- **Storage**: Primary storage for issue images in the `issue-images` bucket

Configuration in `src/supabase/config.js` creates the Supabase client.

### IndexedDB
IndexedDB enables offline functionality:
- **Offline Storage**: Issues reported offline are queued in IndexedDB
- **Sync Service**: Automatically syncs pending issues when online
- **Data Persistence**: Local storage for better performance

Implementation in `src/utils/indexedDB.js` manages the offline queue with operations like add, get, delete, and clear synced issues.





