import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  Bell,
  Phone,
  MessageSquare,
  MapPin,
  Smartphone,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  Users,
  Instagram,
  Wifi,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, monitoringAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Use authLoading state
  const { toast } = useToast();
  
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  // ... other states

  useEffect(() => {
    if (!authLoading) { // Only load data if auth is settled
      loadChildren();
    }
  }, [authLoading]);

  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild._id || selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const childrenData = await usersAPI.getChildren();
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load children.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async (childId) => {
    // ... (implementation is the same)
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <div className="text-white">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* ... header content */}
            {isAdmin && (
                <Button 
                  variant="destructive"
                  onClick={() => navigate('/admin')}
                >
                  Admin Panel
                </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">SMS History</CardTitle>
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-4">Monitor text messages.</p>
                  <Button size="sm" onClick={() => navigate(`/dashboard/sms/${selectedChild?._id}`)} disabled={!selectedChild}>
                    View Logs
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Social Media</CardTitle>
                  <Instagram className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-4">Check social media activity.</p>
                  <Button size="sm" onClick={() => navigate(`/dashboard/social/${selectedChild?._id}`)} disabled={!selectedChild}>
                    View Activity
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Live Location</CardTitle>
                  <MapPin className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-4">Track location in real-time.</p>
                  <Button size="sm" onClick={() => navigate(`/dashboard/location/${selectedChild?._id}/live`)} disabled={!selectedChild}>
                    Open Map
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Screen Time</CardTitle>
                  <Clock className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-4">Manage daily usage limits.</p>
                  <Button size="sm" onClick={() => navigate(`/dashboard/screen-time/${selectedChild?._id}`)} disabled={!selectedChild}>
                    Set Rules
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Web History</CardTitle>
                  <Globe className="w-4 h-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500 mb-4">Track browsing activity.</p>
                  <Button size="sm" onClick={() => navigate(`/dashboard/web-history/${selectedChild?._id}`)} disabled={!selectedChild}>
                    View History
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <Tabs defaultValue="activity" className="space-y-6">
              {/* ... Tabs implementation */}
            </Tabs>
          </>
      </div>
    </div>
  );
};

export default Dashboard;
