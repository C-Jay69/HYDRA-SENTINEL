import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Globe, Search, ArrowLeft, ArrowRight, RefreshCw, ShieldX } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { monitoringAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const WebHistory = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [childName, setChildName] = useState('Child');

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await monitoringAPI.getWebHistory(childId, page, 20, searchTerm);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError(err);
      toast({
        title: "Error Fetching Web History",
        description: err.response?.data?.detail || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [childId, page, searchTerm, toast]);

  useEffect(() => {
    // Fetch child's name from user context
    if (user && user.children) {
      const currentChild = user.children.find(c => c._id === childId);
      if (currentChild) {
        setChildName(currentChild.name);
      }
    }
    fetchHistory();
  }, [fetchHistory, user, childId]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchHistory();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" className="mb-4 border-gray-600 hover:bg-gray-700" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Globe className="h-8 w-8 text-blue-400" />
                    <div>
                        <CardTitle className="text-2xl font-bold">{childName}'s Web History</CardTitle>
                        <p className="text-gray-400">A log of websites visited across all devices.</p>
                    </div>
                </div>
                <Button size="icon" variant="ghost" onClick={fetchHistory} disabled={loading}>
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
                <Search className="absolute ml-3 h-5 w-5 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Filter by domain or title..."
                    className="pl-10 w-full bg-gray-700/50 border-gray-600 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleSearch}
                />
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto" />
                    <p className="mt-2">Loading history...</p>
                </div>
            ) : error || history.length === 0 ? (
              <div className="text-center py-12">
                  <ShieldX className="h-12 w-12 text-gray-500 mx-auto" />
                  <p className="mt-4 font-semibold">No History Found</p>
                  <p className="text-gray-400">No web history entries match your current filters, or this child has a clean slate!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-white">Domain</TableHead>
                    <TableHead className="text-white">Page Title</TableHead>
                    <TableHead className="text-white">Timestamp</TableHead>
                    <TableHead className="text-white text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-700/50 border-gray-700">
                      <TableCell>
                        <a href={`http://${item.domain}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                            {item.domain}
                        </a>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.title}</TableCell>
                      <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                            {item.visit_duration}s
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex justify-between items-center mt-6">
              <Button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading} variant="outline" className="border-gray-600">
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <span className="text-sm text-gray-400">Page {page}</span>
              <Button onClick={() => setPage(p => p + 1)} disabled={loading} variant="outline" className="border-gray-600">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WebHistory;
