import { MapPin, UserPlus, Eye } from 'lucide-react';
import { Link } from 'react-router';
import { LocationDisplay } from './LocationDisplay';

export const SupervisorIssueCard = ({ issue, onAssignClick }) => {
  return (
    <div className="p-5 bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg line-clamp-1">{issue.title || 'Untitled Issue'}</h3>
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
          issue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          issue.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
          'bg-green-100 text-green-800'
        }`}>
          {(issue.status || 'unknown').replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {issue.description || 'No description provided.'}
      </p>
      <div className="flex items-center justify-between mt-4 border-t border-border pt-4">
        <div className="flex items-center text-sm text-muted-foreground max-w-[50%]">
          <MapPin className="h-4 w-4 mr-1.5 text-primary flex-shrink-0" />
          <LocationDisplay location={issue.location} className="line-clamp-1 truncate" />
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/issue/${issue.id}`}
            className="px-4 py-2 border border-border text-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Issue
          </Link>
          <button
            onClick={() => onAssignClick(issue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Engineer
          </button>
        </div>
      </div>
    </div>
  );
};
