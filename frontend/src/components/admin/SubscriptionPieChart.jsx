import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminAPI } from '../../services/api';
import { useToast } from '../../hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SubscriptionPieChart = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const subscriptionData = await adminAPI.getSubscriptionAnalytics(timeRange);
        setData(subscriptionData);
      } catch (error) {
        toast({
          title: "Error Loading Chart",
          description: "Could not load subscription data.",
          variant: "destructive",
        });
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast, timeRange]);

  if (loading) {
    return <div className="text-center py-12">Loading chart...</div>;
  }

  if (!data) {
    return <div className="text-center py-12">No data available</div>;
  }

  const chartData = Object.keys(data).map((key) => ({
    name: key,
    value: data[key],
  }));

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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} 
              labelStyle={{ color: '#F9FAFB' }}
          />
          <Legend wrapperStyle={{ color: '#D1D5DB' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SubscriptionPieChart;
