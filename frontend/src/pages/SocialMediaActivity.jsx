import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Badge } from '../components/ui/badge';
import { AlertTriangle, MessageSquare, Bell } from 'lucide-react';

const SocialMediaActivity = () => {
  const { childId } = useParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // NOTE: This endpoint needs to be created in the backend.
        const response = await api.get(`/monitoring/${childId}/social-media`); 
        setActivities(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load social media activity.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [childId]);

  const renderActivityIcon = (eventType) => {
    switch (eventType) {
      case 'notification_received':
        return <Bell className="w-4 h-4 text-blue-400" />;
      case 'text_capture':
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const renderContent = (activity) => {
    if (activity.eventType === 'notification_received' && activity.content) {
      return (
        <p>
          <strong className='text-gray-300'>[{activity.content.sender}]</strong>: {activity.content.message}
        </p>
      );
    }
    if (activity.eventType === 'text_capture' && activity.content) {
      return <p><strong>Captured Text:</strong> {activity.content.text}</p>;
    }
    return <p>{JSON.stringify(activity.content)}</p>;
  };

  if (loading) {
    return <div className="text-center p-4">Loading social media activity...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen text-white">
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Social Media & Messaging Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {activities.length === 0 ? (
              <p className="text-center text-gray-500 py-16">No social media activity has been recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity._id} className="flex items-start gap-4 p-3 bg-gray-700/50 rounded-lg">
                    <div className="pt-1">{renderActivityIcon(activity.eventType)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-white">{activity.app}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-300">
                        {renderContent(activity)}
                      </div>
                      <Badge variant="outline" className="mt-2 text-xs border-gray-600 text-gray-400">
                        {activity.eventType.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialMediaActivity;
