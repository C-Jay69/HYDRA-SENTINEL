import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Shield, 
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Activity,
  UserCheck,
  UserX,
  Crown,
  Ban,
  Trash2,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({});
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock admin check - in production, this would check user role from backend
  useEffect(() => {
    if (user && !user.email?.includes('admin')) {
      toast({
        title: "Access Denied",
        description: "Admin privileges required",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      
      // Mock admin data - in production, these would be API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDashboardStats({
        totalUsers: 12567,
        activeUsers: 11832,
        totalChildren: 23891,
        totalAlerts: 1432,
        unreadAlerts: 234,
        revenueThisMonth: 284563.20,
        revenueLastMonth: 246821.50,
        newUsersThisMonth: 1205,
        subscriptionBreakdown: {
          Basic: 4523,
          Premium: 6789,
          Family: 1255
        }
      });

      setUsers([
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          subscription: 'Premium',
          status: 'active',
          joinDate: '2024-01-15',
          childrenCount: 2,
          lastLogin: '2024-09-25'
        },
        {
          id: '2',
          name: 'Mike Wilson',
          email: 'mike.wilson@email.com',
          subscription: 'Basic',
          status: 'active',
          joinDate: '2024-03-22',
          childrenCount: 1,
          lastLogin: '2024-09-24'
        },
        {
          id: '3',
          name: 'Jennifer Davis',
          email: 'jen.davis@email.com',
          subscription: 'Family',
          status: 'suspended',
          joinDate: '2024-02-10',
          childrenCount: 3,
          lastLogin: '2024-09-20'
        }
      ]);

      setAlerts([
        {
          id: '1',
          childName: 'Emma Johnson',
          parentName: 'Sarah Johnson',
          type: 'location',
          severity: 'medium',
          title: 'Left Safe Zone',
          description: 'Child left school area',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          childName: 'Alex Wilson',
          parentName: 'Mike Wilson',
          type: 'app',
          severity: 'low',
          title: 'Time Limit Exceeded',
          description: 'TikTok usage exceeded daily limit',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      // Mock user action - in production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(users.map(user => {
        if (user.id === userId) {
          if (action === 'suspend') {
            return { ...user, status: 'suspended' };
          } else if (action === 'activate') {
            return { ...user, status: 'active' };
          }
        }
        return user;
      }));

      toast({
        title: "Action Completed",
        description: `User ${action} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform action",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
          <div className="text-white">Loading Admin Panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <Badge variant="destructive" className="ml-2">ADMIN</Badge>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-red-600">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-red-600">
              User Management
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-red-600">
              System Alerts
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-red-600">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {dashboardStats.totalUsers?.toLocaleString()}
                      </div>
                      <div className="text-gray-400">Total Users</div>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-sm text-green-400 mt-2">
                    +{dashboardStats.newUsersThisMonth} this month
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        ${dashboardStats.revenueThisMonth?.toLocaleString()}
                      </div>
                      <div className="text-gray-400">Revenue This Month</div>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-400" />
                  </div>
                  <div className="text-sm text-green-400 mt-2">
                    +15.2% from last month
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {dashboardStats.totalChildren?.toLocaleString()}
                      </div>
                      <div className="text-gray-400">Monitored Devices</div>
                    </div>
                    <Activity className="w-8 h-8 text-purple-400" />
                  </div>
                  <div className="text-sm text-blue-400 mt-2">
                    Across all families
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {dashboardStats.unreadAlerts}
                      </div>
                      <div className="text-gray-400">Unread Alerts</div>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                  </div>
                  <div className="text-sm text-yellow-400 mt-2">
                    Requires attention
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Breakdown */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Subscription Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {dashboardStats.subscriptionBreakdown && Object.entries(dashboardStats.subscriptionBreakdown).map(([plan, count]) => (
                    <div key={plan} className="text-center">
                      <div className="text-3xl font-bold text-white mb-2">{count}</div>
                      <div className="text-gray-300">{plan} Plan</div>
                      <div className="text-sm text-gray-400">
                        {((count / dashboardStats.totalUsers) * 100).toFixed(1)}% of users
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-gray-700/50 border-gray-600 text-white"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48 bg-gray-700/50 border-gray-600 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-gray-400 text-sm">{user.email}</div>
                        </div>
                        <Badge 
                          variant={user.status === 'active' ? 'default' : 'destructive'}
                          className="ml-4"
                        >
                          {user.status}
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          {user.subscription}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-sm text-gray-400 mr-4">
                          <div>{user.childrenCount} children</div>
                          <div>Joined {new Date(user.joinDate).toLocaleDateString()}</div>
                        </div>
                        
                        {user.status === 'active' ? (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleUserAction(user.id, 'suspend')}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Suspend
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUserAction(user.id, 'activate')}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activate
                          </Button>
                        )}
                        
                        <Button size="sm" variant="outline">
                          <Crown className="w-4 h-4 mr-1" />
                          Upgrade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System-wide Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-gray-700/30 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium">{alert.title}</div>
                          <div className="text-gray-300 text-sm mt-1">{alert.description}</div>
                          <div className="text-gray-400 text-xs mt-2">
                            {alert.childName} - {alert.parentName} - {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <Badge 
                          variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'default' : 'secondary'}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-300">Advanced analytics charts would be implemented here</div>
                  <div className="text-gray-400 text-sm mt-2">Integration with chart libraries like Chart.js or Recharts</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;