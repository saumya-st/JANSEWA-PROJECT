import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Loader } from '../components/Loader';
import {
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { ROLES } from '../utils/roleRoutes';
import { issuesAPI } from '../services/api';
import { toast } from 'sonner';
import { IssueCard } from '../components/IssueCard';
import { SupervisorIssueCard } from '../components/SupervisorIssueCard';

export const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    critical: 0,
  });
  const [issues, setIssues] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [assigningIssue, setAssigningIssue] = useState(null);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;

      const [allIssues, engineersList] = await Promise.all([
        issuesAPI.listAllIssues({ limit: 500 }),
        user.role === ROLES.SUPERVISOR ? issuesAPI.listEngineers() : Promise.resolve([]),
      ]);

      if (user.role === ROLES.SUPERVISOR) {
        setEngineers(
          (engineersList || []).map((e) => ({
            id: e.id,
            name: e.name || e.email || e.id,
            email: e.email || '',
            available: true,
          }))
        );
      }

      const relevantIssues =
        user.role === ROLES.CITIZEN
          ? allIssues.filter((i) => i.createdByUid === user.uid)
          : user.role === ROLES.ENGINEER
          ? allIssues.filter((i) => i.assignedToUid === user.uid)
          : allIssues;

      setIssues(relevantIssues);

      const nextStats = relevantIssues.reduce(
        (acc, issue) => {
          acc.total += 1;
          if (issue.status === 'pending') acc.pending += 1;
          if (issue.status === 'in_progress') acc.inProgress += 1;
          if (issue.status === 'completed') acc.completed += 1;
          if (String(issue.priority || '').toLowerCase() === 'critical') acc.critical += 1;
          return acc;
        },
        { total: 0, pending: 0, inProgress: 0, completed: 0, critical: 0 }
      );

      setStats(nextStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignEngineer = async () => {
    if (!selectedEngineer || !assigningIssue) {
      toast.error('Please select an engineer');
      return;
    }

    setAssignSubmitting(true);
    try {
      await issuesAPI.assignIssue(assigningIssue.id, selectedEngineer);
      toast.success('Engineer assigned successfully!');
      setAssigningIssue(null);
      setSelectedEngineer('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error assigning engineer:', error);
      toast.error('Failed to assign engineer');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const statCards = (() => {
    if (user?.role === ROLES.CITIZEN) {
      return [
        { key: 'total', label: 'My Issues', icon: FileText, color: 'blue' },
        { key: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
        { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
      ];
    }

    if (user?.role === ROLES.ENGINEER) {
      return [
        { key: 'total', label: 'Assigned', icon: FileText, color: 'blue' },
        { key: 'pending', label: 'Pending', icon: Clock, color: 'yellow' },
        { key: 'inProgress', label: 'In Progress', icon: TrendingUp, color: 'orange' },
        { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'green' },
      ];
    }

    if (user?.role === ROLES.SUPERVISOR) {
      return [
        { key: 'total', label: 'Total Issues', icon: FileText, color: 'blue' },
        { key: 'critical', label: 'Critical', icon: AlertCircle, color: 'red' },
        { key: 'inProgress', label: 'In Progress', icon: TrendingUp, color: 'orange' },
        { key: 'completed', label: 'Resolved', icon: CheckCircle, color: 'green' },
      ];
    }

    return [];
  })();

  const renderStatsGrid = () => {
    const gridColsClass = statCards.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4';
    return (
      <div className={`grid grid-cols-1 ${gridColsClass} gap-6 mb-8`}>
        {statCards.map(({ key, label, icon, color }) => (
          <StatCard key={key} icon={icon} label={label} value={stats[key] ?? 0} color={color} />
        ))}
      </div>
    );
  };

  const renderCitizenDashboard = () => (
    <>
      {renderStatsGrid()}

      <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-8 text-primary-foreground mb-8">
        <h2 className="text-2xl font-bold mb-2">Report a New Issue</h2>
        <p className="mb-6 opacity-90">
          Help improve your community by reporting civic issues
        </p>
        <Link
          to="/report"
          className="inline-flex items-center px-6 py-3 bg-background text-primary font-medium rounded-lg hover:bg-accent/10 transition-colors"
        >
          <FileText className="h-5 w-5 mr-2" />
          Report Issue
        </Link>
      </div>
    </>
  );

  const renderEngineerDashboard = () => (
    <>
      {renderStatsGrid()}

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <Link
            to="/assigned"
            className="flex items-center justify-between p-4 bg-accent/10 rounded-lg hover:bg-accent/20 transition-colors"
          >
            <span className="font-medium text-foreground">View Assigned Issues</span>
            <span className="text-primary">→</span>
          </Link>
        </div>
      </div>
    </>
  );

  const renderSupervisorDashboard = () => {
    const unassignedIssues = issues.filter(issue => !issue.assignedToUid);

    return (
      <>
        {renderStatsGrid()}

        <div className="bg-card rounded-xl border border-border p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Unassigned Issues</h2>
          <div className="overflow-y-auto max-h-[500px] pr-2 space-y-4 custom-scrollbar">
            {unassignedIssues.map(issue => (
              <SupervisorIssueCard 
                key={issue.id} 
                issue={issue} 
                onAssignClick={(i) => setAssigningIssue(i)} 
              />
            ))}
            {unassignedIssues.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-accent/5 rounded-xl border border-dashed border-border">
                <p>No unassigned issues found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-2">Map Overview</h2>
          <p className="mb-6 opacity-90">
            View all issues on the map and assign to engineers
          </p>
          <Link
            to="/map"
            className="inline-flex items-center px-6 py-3 bg-background text-foreground font-medium rounded-lg hover:bg-accent/20 transition-colors"
          >
            <MapPin className="h-5 w-5 mr-2" />
            Open Map View
          </Link>
        </div>

        {/* Assign Engineer Modal */}
        {assigningIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl max-w-md w-full p-6 shadow-xl border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Assign Engineer
              </h2>

              <div className="mb-4">
                <h3 className="font-semibold text-foreground line-clamp-1">{assigningIssue.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{assigningIssue.description}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Engineer
                </label>
                <select
                  value={selectedEngineer}
                  onChange={(e) => setSelectedEngineer(e.target.value)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value="">Choose an engineer...</option>
                  {engineers
                    .filter((eng) => eng.available)
                    .map((engineer) => (
                      <option key={engineer.id} value={engineer.id}>
                        {engineer.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleAssignEngineer}
                  disabled={!selectedEngineer || assignSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assignSubmitting ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    setAssigningIssue(null);
                    setSelectedEngineer('');
                  }}
                  className="px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Welcome, {user?.name}!
            </h1>
            <p className="text-muted-foreground mt-1 capitalize">{user?.role} Dashboard</p>
          </div>

          {loading ? (
            <Loader size="lg" />
          ) : (
            <>
              {user?.role === ROLES.CITIZEN && renderCitizenDashboard()}
              {user?.role === ROLES.ENGINEER && renderEngineerDashboard()}
              {user?.role === ROLES.SUPERVISOR && renderSupervisorDashboard()}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-primary/10 text-primary',
    yellow: 'bg-chart-4/10 text-chart-4',
    green: 'bg-chart-3/10 text-chart-3',
    orange: 'bg-accent/10 text-accent',
    red: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};
