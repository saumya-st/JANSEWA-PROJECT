import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Loader } from '../components/Loader';
import {
  MapPin,
  Calendar,
  User,
  FileText,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { issuesAPI } from '../services/api';
import { toast } from 'sonner';

export const IssueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState(null);

  useEffect(() => {
    fetchIssueDetails();
  }, [id]);

  const fetchIssueDetails = async () => {
    try {
      setLoading(true);
      const data = await issuesAPI.getIssue(id);
      setIssue(data);
    } catch (error) {
      console.error('Error fetching issue details:', error);
      toast.error('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="lg:pl-64 pt-16">
          <div className="flex justify-center items-center h-96">
            <Loader size="lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {issue?.imageUrl && (
              <img
                src={issue.imageUrl}
                alt={issue.title}
                className="w-full h-64 object-contain bg-slate-100"
              />
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold text-foreground flex-1">
                  {issue?.title}
                </h1>
                <div className="flex flex-col gap-2 ml-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      issue?.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : issue?.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {issue?.status?.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                    {issue?.priority}
                  </span>
                </div>
              </div>

              <div className="prose max-w-none mb-6">
                <p className="text-muted-foreground">{issue?.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">{issue?.location?.address}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {issue?.location?.lat?.toFixed?.(6)}, {issue?.location?.lng?.toFixed?.(6)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Reported On</p>
                    <p className="text-sm text-muted-foreground">{formatDate(issue?.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Reported By</p>
                    <p className="text-sm text-muted-foreground">{issue?.reportedBy?.name}</p>
                    <p className="text-xs text-muted-foreground">{issue?.reportedBy?.email}</p>
                  </div>
                </div>

                {issue?.assignedTo && (
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Assigned To</p>
                      <p className="text-sm text-muted-foreground">{issue?.assignedTo?.name}</p>
                      <p className="text-xs text-muted-foreground">{issue?.assignedTo?.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Timeline
                </h2>
                <div className="space-y-4">
                  {issue?.timeline?.map((event, index) => (
                    <div key={index} className="flex">
                      <div className="flex flex-col items-center mr-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                        </div>
                        {index < issue.timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-border mt-2"></div>
                        )}
                      </div>
                      <div className="pb-8">
                        <p className="text-sm font-medium text-foreground">{event.event}</p>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
