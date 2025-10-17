
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { monitoringAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';

const SmsHistory = () => {
  const { childId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSmsHistory = async () => {
      try {
        setLoading(true);
        const response = await monitoringAPI.getMessages(childId);
        setMessages(response);
        setError(null);
      } catch (err) {
        setError('Failed to load SMS history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmsHistory();
  }, [childId]);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading) {
    return <div className="text-center p-4">Loading SMS history...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMS History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500">No SMS messages found.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg._id} className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>{getInitials(msg.address)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold">{msg.address}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(msg.date).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{msg.body}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default SmsHistory;
