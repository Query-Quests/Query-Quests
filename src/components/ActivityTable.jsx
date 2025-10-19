import { Eye } from "lucide-react";

export default function ActivityTable({ 
  activities, 
  showFooter = false, 
  footerLink = null,
  emptyMessage = "No activities found",
  emptySubMessage = "Activities will appear here as students engage"
}) {
  if (activities.length === 0) {
    return (
      <div className="space-y-1">
        <div className="text-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">{emptyMessage}</p>
          <p className="text-sm text-gray-400 mt-1">{emptySubMessage}</p>
        </div>
        
        {showFooter && footerLink && (
          <div className="border-t border-gray-200 mt-4 pt-4">
            {footerLink}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-4 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            activity.type === 'student' ? 'bg-blue-500' : 'bg-green-500'
          }`}></div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
              <span className="text-sm font-medium text-gray-900">
                {activity.type === 'student' ? activity.student : 'System'}
              </span>
              <span className="text-sm text-gray-600">
                {activity.action}
                {activity.challenge && (
                  <span className="font-medium text-purple-600"> &quot;{activity.challenge}&quot;</span>
                )}
                {activity.points && (
                  <span className="font-medium text-blue-600"> (+{activity.points} points)</span>
                )}
              </span>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <span className="text-xs text-muted-foreground">{activity.time}</span>
          </div>
        </div>
      ))}
      
      {showFooter && footerLink && (
        <div className="border-t border-gray-200 mt-4 pt-4">
          {footerLink}
        </div>
      )}
    </div>
  );
} 