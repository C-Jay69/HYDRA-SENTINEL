import React, { useState, useEffect, useMemo } from 'react';
import { adminAPI } from '../../services/api';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RefreshCw } from 'lucide-react';
import RevenueSummary from './RevenueSummary';

const Revenue = () => {
  const [financials, setFinancials] = useState({ transactions: [], subscriptions: [] });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // State for filtering and searching
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [subscriptionSearchTerm, setSubscriptionSearchTerm] = useState('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('all');

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getFinancialData();
      setFinancials(data);
    } catch (error) {
      toast({ title: 'Error Loading Financial Data', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return financials.transactions.filter(t => {
      const searchTerm = transactionSearchTerm.toLowerCase();
      return (
        (t.transaction_id && t.transaction_id.toLowerCase().includes(searchTerm)) ||
        (t.user_id && t.user_id.toLowerCase().includes(searchTerm))
      );
    });
  }, [financials.transactions, transactionSearchTerm]);

  const filteredSubscriptions = useMemo(() => {
    return financials.subscriptions.filter(s => {
      const searchTerm = subscriptionSearchTerm.toLowerCase();
      const matchesSearch =
        (s.subscription_id && s.subscription_id.toLowerCase().includes(searchTerm)) ||
        (s.user_id && s.user_id.toLowerCase().includes(searchTerm));
      
      const matchesStatus =
        subscriptionStatusFilter === 'all' || s.status === subscriptionStatusFilter;
        
      return matchesSearch && matchesStatus;
    });
  }, [financials.subscriptions, subscriptionSearchTerm, subscriptionStatusFilter]);

  if (loading) {
    return (
        <div className="flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
        <span className="ml-2 text-white">Loading financial data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RevenueSummary transactions={financials.transactions} subscriptions={financials.subscriptions} />

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Transactions</CardTitle>
            <div className="flex gap-2">
                <Input 
                  placeholder="Search by ID..."
                  value={transactionSearchTerm}
                  onChange={(e) => setTransactionSearchTerm(e.target.value)}
                  className="max-w-xs bg-gray-700/50 border-gray-600 text-white"
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Transaction ID</TableHead>
                <TableHead className="text-white">User ID</TableHead>
                <TableHead className="text-white">Amount</TableHead>
                <TableHead className="text-white">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => (
                <TableRow key={t._id}>
                  <TableCell className="text-gray-300">{t.transaction_id}</TableCell>
                  <TableCell className="text-gray-300">{t.user_id}</TableCell>
                  <TableCell className="text-gray-300">${t.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-gray-300">{new Date(t.date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
           <div className="flex justify-between items-center">
            <CardTitle className="text-white">Subscriptions</CardTitle>
            <div className="flex gap-2">
                <Input 
                  placeholder="Search by ID..."
                  value={subscriptionSearchTerm}
                  onChange={(e) => setSubscriptionSearchTerm(e.target.value)}
                  className="max-w-xs bg-gray-700/50 border-gray-600 text-white"
                />
                <Select value={subscriptionStatusFilter} onValueChange={setSubscriptionStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-gray-700/50 border-gray-600 text-white">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-white">Subscription ID</TableHead>
                <TableHead className="text-white">User ID</TableHead>
                <TableHead className="text-white">Plan</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="text-gray-300">{s.subscription_id}</TableCell>
                  <TableCell className="text-gray-300">{s.user_id}</TableCell>
                  <TableCell className="text-gray-300">
                    <Badge variant={s.plan === 'premium' ? 'gold' : 'secondary'}>{s.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'active' ? 'default' : 'destructive'}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-300">{new Date(s.end_date).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Revenue;
