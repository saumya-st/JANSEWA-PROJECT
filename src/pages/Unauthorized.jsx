import { useNavigate } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRoute } from '../utils/roleRoutes';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (user) {
      navigate(getDefaultRoute(user.role));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <ShieldAlert className="h-10 w-10 text-red-600" />
        </div>

        <h1 className="text-4xl font-bold text-foreground mb-4">Access Denied</h1>

        <p className="text-lg text-muted-foreground mb-8">
          You don&apos;t have permission to access this page. This area is restricted to authorized users only.
        </p>

        <div className="space-y-3">
          <button
            onClick={handleGoBack}
            className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors"
          >
            Go Back
          </button>
        </div>

        {user && (
          <div className="mt-8 p-4 bg-accent rounded-lg">
            <p className="text-sm text-foreground">
              You are logged in as:{' '}
              <span className="font-medium">{user.name}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1 capitalize">
              Role: {user.role}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
