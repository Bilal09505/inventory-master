import React, { useMemo } from 'react';
import { 
  Package, 
  Users, 
  Truck, 
  ShoppingCart, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';
import { useFirestoreCollection } from '../hooks/useFirestore';
import { Product, Customer, Vendor, Sale, Purchase } from '../types';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { data: products } = useFirestoreCollection<Product>('products');
  const { data: customers } = useFirestoreCollection<Customer>('customers');
  const { data: vendors } = useFirestoreCollection<Vendor>('vendors');
  const { data: sales } = useFirestoreCollection<Sale>('sales');
  const { data: purchases } = useFirestoreCollection<Purchase>('purchases');

  const stats = useMemo(() => {
    const lowStock = products.filter(p => p.stock <= p.minStock).length;
    const totalSales = sales.reduce((acc, s) => acc + s.amount, 0);
    const totalPurchases = purchases.reduce((acc, p) => acc + p.amount, 0);
    const profit = totalSales - totalPurchases;

    return [
      { label: 'Total Products', val: products.length.toString(), icon: Package, color: 'bg-blue-100 text-blue-600' },
      { label: 'Total Customers', val: customers.length.toString(), icon: Users, color: 'bg-emerald-100 text-emerald-600' },
      { label: 'Total Vendors', val: vendors.length.toString(), icon: Truck, color: 'bg-amber-100 text-amber-600' },
      { label: 'Low Stock Items', val: lowStock.toString(), icon: AlertCircle, color: 'bg-red-100 text-red-600' },
    ];
  }, [products, customers, vendors, sales, purchases]);

  // Aggregate data for chart (simple monthly grouping)
  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    
    for(let i = 5; i >= 0; i--) {
      const m = (currentMonth - i + 12) % 12;
      last6Months.push({ 
        name: months[m], 
        sales: 0, 
        purchases: 0,
        monthIdx: m
      });
    }

    sales.forEach(s => {
      const d = new Date(s.date);
      const m = d.getMonth();
      const monthData = last6Months.find(lm => lm.monthIdx === m);
      if(monthData) monthData.sales += s.amount;
    });

    purchases.forEach(p => {
      const d = new Date(p.date);
      const m = d.getMonth();
      const monthData = last6Months.find(lm => lm.monthIdx === m);
      if(monthData) monthData.purchases += p.amount;
    });

    return last6Months;
  }, [sales, purchases]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Track your inventory markers and business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={cn("p-3 rounded-lg", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900">{stat.val}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Financial Overview</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                  formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
                />
                <Bar name="Sales" dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Purchases" dataKey="purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Sales Trajectory</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                  formatter={(val: number) => [`$${val.toLocaleString()}`, '']}
                />
                <Line name="Revenue" type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
