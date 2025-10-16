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
import { adminAPI } from '../services/api';
import RevenueChart from '../components/admin/RevenueChart';
import SubscriptionPieChart from '../components/admin/SubscriptionPieChart';
import SignupsBarChart from '../components/admin/SignupsBarChart';
import Revenue from '../components/admin/Revenue';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState({});
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [securityLogs, setSecurityLogs] = useState([]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        toast({ title: "Access Denied", description: "Admin privileges required", variant: "destructive" });
        navigate('/dashboard');
      } else {
        loadAdminData();
        if (activeTab === 'security') {
          loadSecurityLogs();
        }
      }
    }
  }, [user, authLoading, navigate, toast, activeTab]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [stats, usersData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getAllUsers(),
      ]);
      setDashboardStats(stats);
      setUsers(usersData);
      setAlerts([]); // Clear mock data

    } catch (error) {
      toast({
        title: "Error Loading Data",
        description: error.response?.data?.detail || "Failed to load admin dashboard.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const logs = await adminAPI.getSecurityLogs();
      setSecurityLogs(logs);
    } catch (error) {
      toast({
        title: "Error Loading Security Logs",
        description: error.response?.data?.detail || "Failed to load security logs.",
        variant: "destructive"
      });
    }
  };
  
  const handleUserAction = (action, userId) => {
    // Placeholder for future implementation
    toast({ title: `Action: ${action}`, description: `User ID: ${userId}` });
  };

  const filteredUsers = users.filter(u => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      u.email.toLowerCase().includes(searchTermLower) ||
      u.username.toLowerCase().includes(searchTermLower);
    
    const matchesStatus = 
      filterStatus === 'all' || u.status === filterStatus;
      
    return matchesSearch && matchesStatus;
  });

  if (authLoading || loading) {
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
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        {/* Header */}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="alerts">System Alerts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-xs bg-gray-700/50 border-gray-600 text-white"
                    />
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px] bg-gray-700/50 border-gray-600 text-white">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredUsers.map(u => (
                  <Card key={u._id} className="bg-gray-700/50 border-gray-600 p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-white">{u.username}</p>
                          <p className="text-sm text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={u.status === 'active' ? 'default' : 'destructive'}>{u.status}</Badge>
                        <Badge variant="secondary">{u.subscription_plan}</Badge>
                        <p className="text-sm text-gray-400">Children: {u.children.length}</p>
                        <Button variant="destructive" size="sm" onClick={() => handleUserAction('suspend', u._id)}>Suspend</Button>
                        <Button variant="outline" size="sm" onClick={() => handleUserAction('delete', u._id)}>Delete</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue">
            <Revenue />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueChart />
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubscriptionPieChart data={dashboardStats.subscriptionBreakdown} />
                </CardContent>
              </Card>
            </div>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">New User Sign-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <SignupsBarChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Security Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securityLogs.map(log => (
                    <Card key={log._id} className="bg-gray-700/50 border-gray-600 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <AlertTriangle className="text-yellow-400" />
                          <div>
                            <p className="font-semibold text-white">{log.action}</p>
                            <p className="text-sm text-gray-400">User: {log.user_id}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          <p>Timestamp: {new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
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
