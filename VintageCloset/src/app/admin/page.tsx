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
  Receipt,
  Storefront,
  X,
  Check,
  MagnifyingGlass
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

interface PickupCodeData {
  id: string;
  code: string;
  customer_email: string;
  customer_name: string;
  product_title: string;
  product_size: string;
  product_id: string;
  order_id: string;
  active: boolean;
  created_at: string;
  product_image?: string;
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
  
  // Pickup code modal state
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [pickupCodeData, setPickupCodeData] = useState<PickupCodeData | null>(null);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);

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

  // Search for pickup code
  const handleSearchPickupCode = async () => {
    if (!pickupCodeInput.trim()) return;
    
    setIsSearchingCode(true);
    setPickupError(null);
    setPickupCodeData(null);

    try {
      const { data, error } = await supabase
        .from('pickup_codes')
        .select('*')
        .eq('code', pickupCodeInput.trim().toUpperCase())
        .single();

      if (error || !data) {
        setPickupError('Code nicht gefunden');
        return;
      }

      const pickupData = data as PickupCodeData;

      if (!pickupData.active) {
        setPickupError('Dieser Code wurde bereits eingelöst');
        return;
      }

      // Get product image from orders table if available
      if (pickupData.order_id) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('product_image')
          .eq('id', pickupData.order_id)
          .single();
        
        if (orderData) {
          pickupData.product_image = (orderData as { product_image: string }).product_image;
        }
      }

      setPickupCodeData(pickupData);
    } catch (err) {
      console.error('Error searching pickup code:', err);
      setPickupError('Fehler beim Suchen');
    } finally {
      setIsSearchingCode(false);
    }
  };

  // Redeem pickup code (mark as inactive)
  const handleRedeemCode = async () => {
    if (!pickupCodeData) return;

    setIsRedeemingCode(true);

    try {
      const { error } = await supabase
        .from('pickup_codes')
        .update({ 
          active: false, 
          redeemed_at: new Date().toISOString() 
        } as never)
        .eq('id', pickupCodeData.id);

      if (error) {
        setPickupError('Fehler beim Einlösen');
        return;
      }

      // Success - close modal and reset
      setShowPickupModal(false);
      setPickupCodeInput('');
      setPickupCodeData(null);
      setPickupError(null);
    } catch (err) {
      console.error('Error redeeming code:', err);
      setPickupError('Fehler beim Einlösen');
    } finally {
      setIsRedeemingCode(false);
    }
  };

  // Close pickup modal
  const closePickupModal = () => {
    setShowPickupModal(false);
    setPickupCodeInput('');
    setPickupCodeData(null);
    setPickupError(null);
  };

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
          <Button 
            variant="secondary" 
            className="gap-2"
            onClick={() => setShowPickupModal(true)}
          >
            <Storefront size={16} weight="bold" />
            Abholung
          </Button>
        </div>
      </div>

      {/* Pickup Code Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={closePickupModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            {/* Close button */}
            <button
              onClick={closePickupModal}
              className="absolute top-4 right-4 p-2 text-muted hover:text-ink hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} weight="bold" />
            </button>

            <h2 className="text-xl font-display font-bold text-ink mb-4 flex items-center gap-2">
              <Storefront size={24} className="text-accent-start" />
              Abholung bestätigen
            </h2>

            {/* Search Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink mb-2">
                Abholcode eingeben
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pickupCodeInput}
                  onChange={(e) => setPickupCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPickupCode()}
                  placeholder="z.B. ABC123"
                  maxLength={6}
                  className="flex-1 h-12 px-4 rounded-lg border border-hairline bg-white text-ink text-lg font-mono tracking-widest uppercase placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
                />
                <Button
                  onClick={handleSearchPickupCode}
                  disabled={!pickupCodeInput.trim() || isSearchingCode}
                  isLoading={isSearchingCode}
                  className="px-4"
                >
                  <MagnifyingGlass size={20} weight="bold" />
                </Button>
              </div>
              {pickupError && (
                <p className="text-sm text-red-600 mt-2">{pickupError}</p>
              )}
            </div>

            {/* Product Details */}
            {pickupCodeData && (
              <div className="border-t border-hairline pt-4 space-y-4">
                {/* Product Card */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {pickupCodeData.product_image ? (
                        <Image
                          src={pickupCodeData.product_image}
                          alt={pickupCodeData.product_title}
                          width={80}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={24} className="text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-ink">{pickupCodeData.product_title}</h3>
                      <p className="text-sm text-muted">Size: {pickupCodeData.product_size}</p>
                      <p className="text-xs font-mono text-muted mt-2">Code: {pickupCodeData.code}</p>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-ink mb-2">Bestelldetails</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted">Kunde:</span>
                      <span className="font-medium text-ink">{pickupCodeData.customer_name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">E-Mail:</span>
                      <span className="font-medium text-ink text-xs">{pickupCodeData.customer_email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Bestellt am:</span>
                      <span className="font-medium text-ink">
                        {new Date(pickupCodeData.created_at).toLocaleDateString('de-AT', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <Button
                  onClick={handleRedeemCode}
                  disabled={isRedeemingCode}
                  isLoading={isRedeemingCode}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Check size={20} weight="bold" />
                  Abholung bestätigen
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

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
