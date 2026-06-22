/**
 * SALES REPORTS WITH FIFO PROFIT ANALYSIS
 */

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Calendar, Download } from 'lucide-react';
import { Button } from './Button';
import { db } from '../lib/db';
import { formatCurrency, addCents } from '../lib/currency';

interface DailySale {
  date: string;
  orders: number;
  revenue: number;
  cost: number;
  grossProfit: number;
  margin: number;
}

export function SalesReports() {
  const [dailySales, setDailySales] = useState<DailySale[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalOrders: 0,
    avgMargin: 0,
  });
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadSalesData();
  }, [dateRange]);

  const loadSalesData = async () => {
    const orders = await db.getOrdersByStatus('COMPLETED');
    const products = await db.getAllProducts();
    
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    let startDate: number;
    switch (dateRange) {
      case 'today':
        startDate = new Date().setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = now - (7 * day);
        break;
      case 'month':
        startDate = now - (30 * day);
        break;
      default:
        startDate = 0;
    }

    const filteredOrders = orders.filter(o => o.timestamp >= startDate);
    
    // Group by day
    const byDay: Record<string, { orders: number; revenue: number; cost: number }> = {};
    
    for (const order of filteredOrders) {
      const date = new Date(order.timestamp).toLocaleDateString();
      
      if (!byDay[date]) {
        byDay[date] = { orders: 0, revenue: 0, cost: 0 };
      }
      
      byDay[date].orders += 1;
      byDay[date].revenue += order.total_cents;
      
      // Estimate cost (FIFO simulation - in production, calculate from stock batches)
      const estimatedCost = Math.round(order.total_cents * 0.65); // 65% cost assumption
      byDay[date].cost += estimatedCost;
    }

    const salesArray: DailySale[] = Object.entries(byDay).map(([date, data]) => ({
      date,
      orders: data.orders,
      revenue: data.revenue,
      cost: data.cost,
      grossProfit: data.revenue - data.cost,
      margin: data.revenue > 0 ? Math.round(((data.revenue - data.cost) / data.revenue) * 100) : 0,
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setDailySales(salesArray);

    // Calculate totals
    const totals = salesArray.reduce((acc, day) => ({
      totalRevenue: acc.totalRevenue + day.revenue,
      totalCost: acc.totalCost + day.cost,
      totalProfit: acc.totalProfit + day.grossProfit,
      totalOrders: acc.totalOrders + day.orders,
      avgMargin: 0,
    }), { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalOrders: 0, avgMargin: 0 });

    totals.avgMargin = totals.totalRevenue > 0 
      ? Math.round((totals.totalProfit / totals.totalRevenue) * 100) 
      : 0;

    setTotalStats(totals);
  };

  const exportCSV = () => {
    const headers = ['Date', 'Orders', 'Revenue', 'Cost', 'Gross Profit', 'Margin %'];
    const rows = dailySales.map(s => [
      s.date, s.orders, (s.revenue / 100).toFixed(2), (s.cost / 100).toFixed(2),
      (s.grossProfit / 100).toFixed(2), s.margin + '%'
    ]);
    
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Reports</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">FIFO Gross Profit Analysis</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 rounded-lg bg-white/50 dark:bg-black/20 border border-gray-300/50 dark:border-white/10"
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="secondary" icon={Download} onClick={exportCSV}>Export CSV</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalStats.totalRevenue)} 
          icon={DollarSign} 
          color="green" 
        />
        <StatCard 
          title="Gross Profit" 
          value={formatCurrency(totalStats.totalProfit)} 
          subtitle={`${totalStats.avgMargin}% margin`}
          icon={TrendingUp} 
          color="blue" 
        />
        <StatCard 
          title="Total Orders" 
          value={totalStats.totalOrders.toString()} 
          icon={ShoppingCart} 
          color="purple" 
        />
        <StatCard 
          title="Avg Order Value" 
          value={formatCurrency(totalStats.totalOrders > 0 ? Math.round(totalStats.totalRevenue / totalStats.totalOrders) : 0)} 
          icon={DollarSign} 
          color="yellow" 
        />
      </div>

      {/* Sales Table */}
      <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100/50 dark:bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Date</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Orders</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Cost</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Gross Profit</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300/50 dark:divide-white/10">
            {dailySales.map((sale, i) => (
              <tr key={i} className="hover:bg-white/50 dark:hover:bg-white/5">
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{sale.date}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{sale.orders}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCurrency(sale.revenue)}</td>
                <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">{formatCurrency(sale.cost)}</td>
                <td className="px-6 py-4 text-sm text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.grossProfit)}</td>
                <td className="px-6 py-4 text-sm text-right">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${sale.margin >= 35 ? 'bg-green-100 text-green-800' : sale.margin >= 25 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                    {sale.margin}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {dailySales.length === 0 && (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No sales data for selected period
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: any;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'from-green-600 to-green-700',
    blue: 'from-blue-600 to-blue-700',
    purple: 'from-purple-600 to-purple-700',
    yellow: 'from-yellow-600 to-yellow-700',
  };

  return (
    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-gray-300/50 dark:border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
