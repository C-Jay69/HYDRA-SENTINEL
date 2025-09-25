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
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  MoreHorizontal,
  Eye,
  EyeOff,
  Loader2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, monitoringAPI } from '../services/api';
import { useToast } from '../hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [apps, setApps] = useState([]);
  const [webHistory, setWebHistory] = useState([]);
  const [summary, setSummary] = useState({});

  // Load children and initial data
  useEffect(() => {
    loadChildren();
  }, []);

  // Load child-specific data when selected child changes
  useEffect(() => {
    if (selectedChild) {
      loadChildData(selectedChild.id);
    }
  }, [selectedChild]);

  const loadChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await usersAPI.getChildren();
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]);
      }
    } catch (error) {
      console.error('Failed to load children:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.message || 
                          "Failed to load children data";
      toast({
        title: "Error",
        description: typeof errorMessage === 'string' ? errorMessage : "Failed to load children data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadChildData = async (childId) => {
    try {
      const [
        alertsData,
        callLogsData,
        messagesData,
        locationsData,
        appsData,
        webHistoryData,
        summaryData
      ] = await Promise.all([
        monitoringAPI.getAlerts(childId, false, 10),
        monitoringAPI.getCallLogs(childId, 10),
        monitoringAPI.getMessages(childId, 10),
        monitoringAPI.getLocations(childId, 10),
        monitoringAPI.getAppUsage(childId, 10),
        monitoringAPI.getWebHistory(childId, 10),
        monitoringAPI.getChildSummary(childId)
      ]);

      setAlerts(alertsData);
      setCallLogs(callLogsData);
      setMessages(messagesData);
      setLocations(locationsData);
      setApps(appsData);
      setWebHistory(webHistoryData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load child data:', error);
      toast({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive"
      });
    }
  };

  const markAlertAsRead = async (alertId) => {
    if (!selectedChild) return;
    
    try {
      await monitoringAPI.markAlertAsRead(selectedChild.id, alertId);
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, read: true } : alert
      ));
      toast({
        title: "Alert marked as read",
      });
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark alert as read",
        variant: "destructive"
      });
    }
  };

  const dismissAlert = async (alertId) => {
    if (!selectedChild) return;
    
    try {
      await monitoringAPI.dismissAlert(selectedChild.id, alertId);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast({
        title: "Alert dismissed",
      });
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      toast({
        title: "Error", 
        description: "Failed to dismiss alert",
        variant: "destructive"
      });
    }
  };

  const getAlertIcon = (type) => {
    switch(type) {
      case 'location': return <MapPin className="w-4 h-4" />;
      case 'app': return <Smartphone className="w-4 h-4" />;
      case 'web': return <Globe className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertColor = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">ParentGuard Dashboard</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-6 h-6 text-gray-300 hover:text-white cursor-pointer" />
                {alerts.filter(a => !a.read).length > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">
                      {alerts.filter(a => !a.read).length}
                    </span>
                  </div>
                )}
              </div>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/billing')}
                className="text-gray-300 hover:text-white"
              >
                Billing
              </Button>

              {/* Admin Link - only show for admin users */}
              {user?.email?.includes('admin') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="text-red-300 hover:text-red-200"
                >
                  Admin Panel
                </Button>
              )}
              
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              
              <div className="text-right">
                <div className="text-white font-medium">{user?.name || 'User'}</div>
                <div className="text-sm text-gray-400">{user?.subscription || 'Basic'} Plan</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : (
          <>
            {/* Child Selector */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Select Child</h2>
                <Button 
                  onClick={() => navigate('/add-child')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                >
                  + Add Child
                </Button>
              </div>
              
              {children.length === 0 ? (
                <Card className="bg-gray-800/50 border-gray-700 text-center p-8">
                  <CardContent className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-gray-700 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-white font-medium">No Children Added Yet</div>
                    <div className="text-gray-400 max-w-md mx-auto">
                      Start monitoring your family's digital safety by adding your first child's device.
                    </div>
                    <Button 
                      onClick={() => navigate('/add-child')}
                      className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                    >
                      Add Your First Child
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex gap-4">
                  {children.map((child) => (
                  <Card 
                    key={child.id || child._id}
                    className={`cursor-pointer transition-all ${
                      selectedChild?.id === (child.id || child._id)
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => setSelectedChild(child)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={child.avatar} />
                          <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-white font-medium">{child.name}</div>
                          <div className="text-sm text-gray-400">{child.device}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${
                              child.status === 'online' ? 'bg-green-500' : 'bg-gray-500'
                            }`}></div>
                            <span className="text-xs text-gray-400">
                              {child.status === 'online' ? 'Online' : 'Last seen 2h ago'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {summary.calls_today || 0}
                  </div>
                  <div className="text-gray-400">Calls Today</div>
                </div>
                <Phone className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {summary.messages_today || 0}
                  </div>
                  <div className="text-gray-400">Messages</div>
                </div>
                <MessageSquare className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {summary.active_apps || 0}
                  </div>
                  <div className="text-gray-400">Apps Active</div>
                </div>
                <Smartphone className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-white">
                    {summary.unread_alerts || 0}
                  </div>
                  <div className="text-gray-400">New Alerts</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

            {/* Alerts Section */}
            {alerts.filter(a => !a.read).length > 0 && (
          <Card className="bg-red-500/10 border-red-500/30 mb-8">
            <CardHeader>
              <CardTitle className="text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Active Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts
                  .filter(a => a.childId === selectedChild.id && !a.read)
                  .map((alert) => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.severity)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert.type)}
                          <div>
                            <div className="font-medium">{alert.title}</div>
                            <div className="text-sm opacity-80">{alert.description}</div>
                            <div className="text-xs opacity-60 mt-1">
                              {new Date(alert.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => markAlertAsRead(alert.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => dismissAlert(alert.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="activity" className="data-[state=active]:bg-blue-600">
              Activity Overview
            </TabsTrigger>
            <TabsTrigger value="calls" className="data-[state=active]:bg-blue-600">
              Calls & Messages
            </TabsTrigger>
            <TabsTrigger value="location" className="data-[state=active]:bg-blue-600">
              Location
            </TabsTrigger>
            <TabsTrigger value="apps" className="data-[state=active]:bg-blue-600">
              Apps & Web
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {messages
                    .slice(0, 3)
                    .map((message) => (
                      <div key={message.id} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-green-400 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="text-white font-medium">{message.contact}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-gray-300 text-sm mt-1">{message.content}</div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {message.type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* Screen Time */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Screen Time Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apps
                      .slice(0, 4)
                      .map((app) => (
                        <div key={app.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{app.icon}</div>
                            <div>
                              <div className="text-white font-medium">{app.name}</div>
                              <div className="text-sm text-gray-400">{app.timeSpent}</div>
                            </div>
                          </div>
                          {app.blocked ? (
                            <EyeOff className="w-4 h-4 text-red-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Call & Message History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {callLogs
                    .map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${
                            call.type === 'incoming' ? 'bg-green-500/20' : 'bg-blue-500/20'
                          }`}>
                            <Phone className={`w-4 h-4 ${
                              call.type === 'incoming' ? 'text-green-400' : 'text-blue-400'
                            }`} />
                          </div>
                          <div>
                            <div className="text-white font-medium">{call.contact}</div>
                            <div className="text-sm text-gray-400">{call.number}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white">{call.duration}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(call.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="location">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Location History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locations
                    .map((location) => (
                      <div key={location.id} className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                        <div className="p-2 bg-blue-500/20 rounded-full">
                          <MapPin className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{location.address}</div>
                          <div className="text-sm text-gray-400">
                            Accuracy: {location.accuracy}m • {new Date(location.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          View Map
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apps">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">App Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apps
                      .map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{app.icon}</div>
                            <div>
                              <div className="text-white font-medium">{app.name}</div>
                              <div className="text-sm text-gray-400">
                                {app.timeSpent} • {app.launches} launches
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.exceeded && (
                              <Badge variant="destructive" className="text-xs">Limit Exceeded</Badge>
                            )}
                            <Button size="sm" variant={app.blocked ? "destructive" : "outline"}>
                              {app.blocked ? "Blocked" : "Allow"}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Web History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {webHistory
                      .map((site) => (
                        <div key={site.id} className="flex items-start justify-between p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-start gap-3">
                            <Globe className={`w-4 h-4 mt-1 ${
                              site.blocked ? 'text-red-400' : 'text-blue-400'
                            }`} />
                            <div>
                              <div className="text-white font-medium text-sm">{site.title}</div>
                              <div className="text-xs text-gray-400">{site.domain}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(site.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {site.blocked && (
                            <Badge variant="destructive" className="text-xs">Blocked</Badge>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;