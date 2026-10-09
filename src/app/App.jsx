import { RouterProvider } from 'react-router';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { AuthProvider } from '../auth/AuthContext';
import { router } from './routes';
import { syncService } from '../utils/syncService';

export default function App() {
  useEffect(() => {
    // Initialize offline sync service
    syncService.startAutoSync();

    // Listen for sync events
    syncService.addListener((event, data) => {
      console.log('Sync event:', event, data);
    });
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}
