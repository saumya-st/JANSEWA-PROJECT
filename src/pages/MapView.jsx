import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { Loader } from '../components/Loader';
import { UserPlus, Navigation2 } from 'lucide-react';
import { issuesAPI } from '../services/api';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLORS = {
  pending: '#EAB308',
  in_progress: '#3B82F6',
  completed: '#10B981',
};

export const MapView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [assigningIssue, setAssigningIssue] = useState(null);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const defaultCenter = [20.5937, 78.9629]; // New Delhi

  useEffect(() => {
    fetchMapData();
  }, []);

  const fetchMapData = async () => {
    try {
      setLoading(true);

      const [allIssues, engineersList] = await Promise.all([
        issuesAPI.listAllIssues({ limit: 500 }),
        issuesAPI.listEngineers(),
      ]);

      setIssues(allIssues);
      setEngineers(
        (engineersList || []).map((e) => ({
          id: e.id,
          name: e.name || e.email || e.id,
          email: e.email || '',
          available: true,
        }))
      );
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast.error('Failed to load map data');
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
      fetchMapData();
    } catch (error) {
      console.error('Error assigning engineer:', error);
      toast.error('Failed to assign engineer');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const createCustomMarker = (status) => {
    const color = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:pl-64 pt-16">
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          <div className="px-4 sm:px-6 lg:px-8 py-4 bg-card border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Map View</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {issues.length} issues across the city
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                    <span className="text-foreground">Pending</span>
                  </div>
                  <div className="flex items-center ml-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span className="text-foreground">In Progress</span>
                  </div>
                  <div className="flex items-center ml-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span className="text-foreground">Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <Loader size="lg" />
              </div>
            ) : (
              <MapContainer
                center={defaultCenter}
                zoom={5}
                className="h-full w-full"
                style={{ zIndex: 0 }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {issues
                  .filter((issue) => issue?.location?.lat != null && issue?.location?.lng != null)
                  .map((issue) => (
                  <Marker
                    key={issue.id}
                    position={[issue.location.lat, issue.location.lng]}
                    icon={createCustomMarker(issue.status)}
                  >
                    <Popup>
                      <div className="min-w-[250px] p-2">
                        <h3 className="font-semibold text-black mb-2">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{issue.description}</p>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              issue.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : issue.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {issue.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                            {issue.priority}
                          </span>
                        </div>

                        {issue.assignedTo ? (
                          <p className="text-sm text-muted-foreground mb-2">
                            Assigned to: <span className="font-medium">{issue.assignedTo.name}</span>
                          </p>
                        ) : (
                          <button
                            onClick={() => {
                              setAssigningIssue(issue);
                              setSelectedIssue(issue);
                            }}
                            className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign Engineer
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        </div>

        {/* Assign Engineer Modal */}
        {assigningIssue && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Assign Engineer
              </h2>

              <div className="mb-4">
                <h3 className="font-semibold text-foreground">{assigningIssue.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{assigningIssue.description}</p>
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {assignSubmitting ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    setAssigningIssue(null);
                    setSelectedEngineer('');
                  }}
                  className="px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
