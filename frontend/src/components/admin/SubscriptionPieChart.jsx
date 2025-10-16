import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SubscriptionPieChart = ({ data }) => {
  if (!data) {
    return <div className="text-center py-12">No data available</div>;
  }

  const chartData = Object.keys(data).map((key) => ({
    name: key,
    value: data[key],
  }));

  return (
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
  );
};

export default SubscriptionPieChart;
