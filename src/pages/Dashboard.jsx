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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (!user?.uid) return;

      const allIssues = await issuesAPI.listAllIssues({ limit: 500 });

      const relevantIssues =
        user.role === ROLES.CITIZEN
          ? allIssues.filter((i) => i.createdByUid === user.uid)
          : user.role === ROLES.ENGINEER
          ? allIssues.filter((i) => i.assignedToUid === user.uid)
          : allIssues;

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

  const renderStatsGrid = () => (
    <div className={`grid grid-cols-1 md:grid-cols-${statCards.length === 3 ? '3' : '4'} gap-6 mb-8`}>
      {statCards.map(({ key, label, icon, color }) => (
        <StatCard key={key} icon={icon} label={label} value={stats[key] ?? 0} color={color} />
      ))}
    </div>
  );

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

  const renderSupervisorDashboard = () => (
    <>
      {renderStatsGrid()}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-white">
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
    </>
  );

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
