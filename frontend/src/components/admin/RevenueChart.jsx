import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../../services/api';
import { useToast } from '../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const RevenueChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const revenueData = await adminAPI.getRevenueAnalytics(timeRange);
        setData(revenueData);
      } catch (error) {
        toast({
          title: "Error Loading Chart",
          description: "Could not load revenue analytics data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast, timeRange]);

  if (loading) {
    return <div className="text-center py-12">Loading chart...</div>;
  }

  return (
    <div>
        <div className="flex justify-end mb-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[180px] bg-gray-700/50 border-gray-600 text-white">
                <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white">
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <ResponsiveContainer width="100%" height={400}>
        <LineChart
            data={data}
            margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
            }}
        >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} 
                labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend wrapperStyle={{ color: '#D1D5DB' }} />
            <Line type="monotone" dataKey="revenue" stroke="#38BDF8" strokeWidth={2} activeDot={{ r: 8 }} />
        </LineChart>
        </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
