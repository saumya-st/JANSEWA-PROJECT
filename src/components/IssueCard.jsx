import { MapPin, Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
};

const PRIORITY_STYLES = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-purple-100 text-purple-700',
};

export const IssueCard = ({ issue, className = '' }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Link
      to={`/issue/${issue._id || issue.id}`}
      className={[
        'block h-[340px] bg-card text-card-foreground rounded-lg border border-border p-4 hover:shadow-md transition-shadow',
        'flex flex-col overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground flex-1 line-clamp-2">{issue.title}</h3>
        <div className="flex flex-col gap-1 ml-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              STATUS_STYLES[issue.status] || STATUS_STYLES.pending
            }`}
          >
            {issue.status?.replace('_', ' ').toUpperCase()}
          </span>
          {issue.priority && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                PRIORITY_STYLES[issue.priority.toLowerCase()] || PRIORITY_STYLES.low
              }`}
            >
              {issue.priority}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{issue.description}</p>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {issue.location && (
          <div className="flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[150px]">
              {issue.location.address || `${issue.location.lat}, ${issue.location.lng}`}
            </span>
          </div>
        )}
        {issue.createdAt && (
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formatDate(issue.createdAt)}</span>
          </div>
        )}
      </div>

      {issue.imageUrl && (
        <div className="mt-auto pt-3">
          <img
            src={issue.imageUrl}
            alt={issue.title}
            className="w-full h-32 object-contain rounded bg-slate-100"
          />
        </div>
      )}
    </Link>
  );
};
