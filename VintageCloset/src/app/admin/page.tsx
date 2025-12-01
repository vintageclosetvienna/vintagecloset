'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CurrencyEur, 
  Package, 
  ShoppingCart, 
  Clock,
  Plus,
  Notebook,
  CalendarBlank,
  ArrowRight,
  Receipt
} from '@phosphor-icons/react';
import { StatCard, DataTable } from '@/components/admin';
import { Button } from '@/components/ui/Button';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface DashboardStats {
  totalSales: string;
  itemsSold: string;
  activeListings: string;
  pendingOrders: string;
}

interface RecentSale {
  id: string;
  product: string;
  image: string;
  price: string;
  date: string;
  status: string;
}

interface OrderRecord {
  id: string;
  status: string;
  final_price: string;
  product_title: string;
  product_image: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  paid: 'bg-green-50 text-green-700',
  shipped: 'bg-blue-50 text-blue-700',
  pending: 'bg-amber-50 text-amber-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-red-50 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: '€0',
    itemsSold: '0',
    activeListings: '0',
    pendingOrders: '0',
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch active listings count
        const { count: activeCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('is_sold', false);

        // Fetch orders for stats
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        const orders = (ordersData || []) as OrderRecord[];

        if (orders.length > 0) {
          // Calculate total sales (paid orders only)
          const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'delivered');
          const totalSales = paidOrders.reduce((sum, o) => sum + parseFloat(o.final_price || '0'), 0);
          
          // Count pending orders
          const pendingCount = orders.filter(o => o.status === 'pending').length;

          // Map recent sales
          const recent: RecentSale[] = orders.slice(0, 5).map(o => ({
            id: o.id,
            product: o.product_title || 'Unknown Product',
            image: o.product_image || '',
            price: `€${parseFloat(o.final_price || '0').toFixed(2)}`,
            date: o.created_at,
            status: o.status,
          }));

          setStats({
            totalSales: `€${totalSales.toFixed(2)}`,
            itemsSold: paidOrders.length.toString(),
            activeListings: (activeCount || 0).toString(),
            pendingOrders: pendingCount.toString(),
          });

          setRecentSales(recent);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (item: RecentSale) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface flex-shrink-0">
            {item.image ? (
              <Image 
                src={item.image} 
                alt={item.product} 
                width={40} 
                height={40} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package size={20} className="text-muted" />
              </div>
            )}
          </div>
          <span className="font-medium text-ink truncate max-w-[200px]">{item.product}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (item: RecentSale) => (
        <span className="font-medium">{item.price}</span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: RecentSale) => (
        <span className="text-muted">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: RecentSale) => (
        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColors[item.status] || 'bg-gray-50 text-gray-700'}`}>
          {item.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink">Dashboard</h1>
        <p className="text-muted mt-1">Welcome back! Here&apos;s what&apos;s happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Sales"
          value={isLoading ? '...' : stats.totalSales}
          subtitle="All time"
          icon={CurrencyEur}
        />
        <StatCard
          title="Items Sold"
          value={isLoading ? '...' : stats.itemsSold}
          subtitle="All time"
          icon={ShoppingCart}
        />
        <StatCard
          title="Active Listings"
          value={isLoading ? '...' : stats.activeListings}
          subtitle="In store"
          icon={Package}
        />
        <StatCard
          title="Pending Orders"
          value={isLoading ? '...' : stats.pendingOrders}
          subtitle="Awaiting payment"
          icon={Clock}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/products/new">
            <Button className="gap-2">
              <Plus size={16} weight="bold" />
              Add Product
            </Button>
          </Link>
          <Link href="/admin/journal/new">
            <Button variant="secondary" className="gap-2">
              <Notebook size={16} weight="bold" />
              Write Journal
            </Button>
          </Link>
          <Link href="/admin/events/new">
            <Button variant="secondary" className="gap-2">
              <CalendarBlank size={16} weight="bold" />
              Create Event
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Sales */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Recent Orders</h2>
        </div>
        {isLoading ? (
          <div className="bg-white rounded-xl border border-hairline p-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-surface rounded w-1/4 mx-auto" />
              <div className="h-4 bg-surface rounded w-1/2 mx-auto" />
            </div>
          </div>
        ) : recentSales.length > 0 ? (
          <DataTable
            columns={columns}
            data={recentSales}
            keyExtractor={(item) => item.id}
            emptyMessage="No recent orders"
          />
        ) : (
          <div className="bg-white rounded-xl border border-hairline p-8 text-center">
            <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt size={24} className="text-muted" />
            </div>
            <p className="text-muted">No orders yet</p>
            <p className="text-sm text-muted mt-1">Orders will appear here when customers make purchases.</p>
          </div>
        )}
      </div>
    </div>
  );
}
