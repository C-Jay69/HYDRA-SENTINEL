import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Shield, 
  Users,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { adminAPI } from '../services/api';
import RevenueChart from '../components/admin/RevenueChart';
import SubscriptionPieChart from '../components/admin/SubscriptionPieChart';
import SignupsBarChart from '../components/admin/SignupsBarChart';
import Revenue from '../components/admin/Revenue';

const StatCard = ({ icon, title, value, subValue }) => (
    <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-white">{value}</div>
            {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
        </CardContent>
    </Card>
);

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [securityLogs, setSecurityLogs] = useState([]);

  const loadUsers = useCallback(async () => {
    try {
      if (searchTerm) {
        const data = await adminAPI.searchUsers(searchTerm);
        setUsers(data);
      } else {
        const data = await adminAPI.filterUsers(filterStatus, filterPlan);
        setUsers(data);
      }
    } catch (error) {
      toast({ title: 'Error loading users', description: error.message, variant: 'destructive' });
    }
  }, [searchTerm, filterStatus, filterPlan, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        toast({ title: 'Access Denied', description: 'Admin privileges required', variant: 'destructive' });
        navigate('/dashboard');
        return;
      }
      if (activeTab === 'users') {
        loadUsers();
      } else if (activeTab === 'dashboard') {
        loadAdminData();
      } else if (activeTab === 'security') {
        loadSecurityLogs();
      }
    }
  }, [user, authLoading, navigate, toast, activeTab, loadUsers]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const stats = await adminAPI.getDashboardStats();
      setDashboardStats(stats);
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
  
  const handleUserAction = async (action, userId, isActive) => {
    try {
      if (action === 'suspend') {
        await adminAPI.suspendUser(userId);
        toast({ title: 'User suspended' });
      } else if (action === 'unsuspend') {
        await adminAPI.unsuspendUser(userId);
        toast({ title: 'User unsuspended' });
      }
      loadUsers();
    } catch (error) {
      toast({ title: `Error ${action}ing user`, description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await adminAPI.deleteUser(userId);
      toast({ title: 'User deleted' });
      loadUsers();
    } catch (error) {
      toast({ title: 'Error deleting user', description: error.message, variant: 'destructive' });
    }
  };

  if (authLoading || loading || !dashboardStats) {
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
        <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-800/50 border-gray-700">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="revenue">Financials</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={<Users className="h-4 w-4 text-gray-500" />} title="Total Users" value={dashboardStats.totalUsers} subValue={`${dashboardStats.newUsersThisMonth} new this month`} />
                <StatCard icon={<UserCheck className="h-4 w-4 text-gray-500" />} title="Active Users" value={dashboardStats.activeUsers} subValue={`${(dashboardStats.activeUsers / dashboardStats.totalUsers * 100).toFixed(1)}% of total`} />
                <StatCard icon={<DollarSign className="h-4 w-4 text-gray-500" />} title="Monthly Revenue" value={`$${dashboardStats.revenueThisMonth.toFixed(2)}`} />
                <StatCard icon={<AlertTriangle className="h-4 w-4 text-gray-500" />} title="Unread Alerts" value={dashboardStats.unreadAlerts} />
            </div>
            <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white">Subscription Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <SubscriptionPieChart />
                </CardContent>
            </Card>
          </TabsContent>

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
                  <CardTitle className="text-white">New User Sign-ups</CardTitle>
                </CardHeader>
                <CardContent>
                  <SignupsBarChart />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex gap-2">
                    <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs bg-gray-700/50 border-gray-600 text-white" />
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
                     <Select value={filterPlan} onValueChange={setFilterPlan}>
                      <SelectTrigger className="w-[180px] bg-gray-700/50 border-gray-600 text-white">
                        <SelectValue placeholder="Filter plan" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 text-white">
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Family">Family</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.map(u => (
                  <Card key={u._id} className="bg-gray-700/50 border-gray-600 p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Avatar><AvatarFallback>{u.name.charAt(0).toUpperCase()}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-semibold text-white">{u.name}</p>
                          <p className="text-sm text-gray-400">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={u.is_active ? 'default' : 'destructive'}>{u.is_active ? 'Active' : 'Suspended'}</Badge>
                        <Badge variant="secondary">{u.subscription}</Badge>
                        <p className="text-sm text-gray-400">Children: {u.children.length}</p>
                        {u.is_active ? (
                          <Button variant="destructive" size="sm" onClick={() => handleUserAction('suspend', u._id, u.is_active)}>Suspend</Button>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => handleUserAction('unsuspend', u._id, u.is_active)}>Unsuspend</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleDeleteUser(u._id)}>Delete</Button>
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

          <TabsContent value="security">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader><CardTitle className="text-white">Security Logs</CardTitle></CardHeader>
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
