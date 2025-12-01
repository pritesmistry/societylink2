
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { Bill, Expense, PaymentStatus } from '../types';
import { DollarSign, Users, AlertCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  bills: Bill[];
  expenses: Expense[];
  residentCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ bills, expenses, residentCount }) => {
  
  const stats = useMemo(() => {
    const totalCollected = bills
      .filter(b => b.status === PaymentStatus.PAID)
      .reduce((acc, curr) => acc + curr.totalAmount, 0);
    
    const totalPending = bills
      .filter(b => b.status === PaymentStatus.PENDING || b.status === PaymentStatus.OVERDUE)
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return { totalCollected, totalPending, totalExpenses };
  }, [bills, expenses]);

  const expenseData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    expenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });
    return Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    }));
  }, [expenses]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-green-100 rounded-full text-green-600 mr-4">
            <span className="font-bold text-xl">₹</span>
          </div>
          <div>
            <p className="text-sm text-slate-500">Collected Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800">₹{stats.totalCollected.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-red-100 rounded-full text-red-600 mr-4">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Pending Dues</p>
            <h3 className="text-2xl font-bold text-slate-800">₹{stats.totalPending.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-blue-100 rounded-full text-blue-600 mr-4">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Expenses</p>
            <h3 className="text-2xl font-bold text-slate-800">₹{stats.totalExpenses.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
          <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 mr-4">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Units</p>
            <h3 className="text-2xl font-bold text-slate-800">{residentCount}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Expense Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-lg font-semibold text-slate-800 mb-4">Financial Health</h4>
           <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
             <div className="text-center p-6">
                <p className="text-slate-500 mb-2">Market Insight</p>
                <p className="text-sm text-slate-600">
                  "Our research indicates that societies tracking expenses in real-time reduce wastage by 15%.
                  Use the <strong>AI Insights</strong> tab to analyze this data."
                </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
