'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Package,
  MapPin,
  User,
  Envelope,
  CreditCard,
  Calendar,
  MagnifyingGlass,
  Download,
  Check,
  Clock,
  Truck,
  X as XIcon
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface Order {
  id: string;
  product_id: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  original_price: number;
  discount_applied: number;
  discount_code: string | null;
  discount_code_amount: number;
  final_price: number;
  product_title: string;
  product_size: string;
  product_image: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'paid', label: 'Paid', icon: Check, color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'delivered', label: 'Delivered', icon: Check, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'cancelled', label: 'Cancelled', icon: XIcon, color: 'bg-red-50 text-red-700 border-red-200' },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrders = async () => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } else {
        setOrders((data as Order[]) || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders based on search and status
  useEffect(() => {
    let filtered = [...orders];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.customer_name.toLowerCase().includes(term) ||
        o.customer_email.toLowerCase().includes(term) ||
        o.product_title.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, filterStatus]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!isSupabaseConfigured()) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus } as never)
        .eq('id', orderId);

      if (error) {
        console.error('Error updating order:', error);
        alert('Failed to update order status');
      } else {
        await fetchOrders();
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Status',
      'Customer Name',
      'Customer Email',
      'Product',
      'Size',
      'Price',
      'Shipping Address',
      'City',
      'Postal Code',
      'Country'
    ];

    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.created_at).toLocaleDateString(),
      o.status,
      o.customer_name,
      o.customer_email,
      o.product_title,
      o.product_size,
      `€${o.final_price.toFixed(2)}`,
      o.shipping_address,
      o.shipping_city,
      o.shipping_postal_code,
      o.shipping_country
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface rounded w-1/4" />
          <div className="h-4 bg-surface rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-ink flex items-center gap-2">
          <Package size={28} weight="duotone" className="text-accent-start" />
          Orders
        </h1>
        <p className="text-muted mt-1">Manage customer orders and shipping</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl border border-hairline p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by customer, product, or order ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-lg border border-hairline bg-surface text-ink placeholder:text-muted focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 px-4 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>

          {/* Export Button */}
          <Button
            variant="secondary"
            onClick={exportToCSV}
            disabled={filteredOrders.length === 0}
            className="gap-2"
          >
            <Download size={16} weight="bold" />
            Export CSV
          </Button>
        </div>

        {/* Results count */}
        <div className="mt-3 text-sm text-muted">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-hairline p-12 text-center">
          <Package size={48} className="text-muted mx-auto mb-4" weight="thin" />
          <p className="text-muted">
            {searchTerm || filterStatus !== 'all' ? 'No orders match your filters' : 'No orders yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusConfig = getStatusConfig(order.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div 
                key={order.id} 
                className="bg-white rounded-xl border border-hairline p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                  {/* Left: Product & Customer Info */}
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                      {order.product_image ? (
                        <Image
                          src={order.product_image}
                          alt={order.product_title}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package size={32} className="text-muted" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-ink mb-1 truncate">{order.product_title}</h3>
                      <p className="text-sm text-muted mb-2">Size: {order.product_size}</p>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <User size={12} weight="bold" />
                          {order.customer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Envelope size={12} weight="bold" />
                          {order.customer_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} weight="bold" />
                          {order.shipping_city}, {order.shipping_country}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status & Price */}
                  <div className="flex md:flex-col items-start md:items-end justify-between md:justify-start gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${statusConfig.color}`}>
                      <StatusIcon size={14} weight="bold" />
                      {statusConfig.label}
                    </span>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-ink">€{order.final_price.toFixed(2)}</div>
                      <div className="text-xs text-muted">{formatDate(order.created_at)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-hairline p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-bold text-ink">Order Details</h2>
                <p className="text-sm text-muted">ID: {selectedOrder.id.slice(0, 8)}...</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-surface rounded-lg transition-colors"
              >
                <XIcon size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Product</h3>
                <div className="flex gap-4">
                  {selectedOrder.product_image && (
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface flex-shrink-0">
                      <Image
                        src={selectedOrder.product_image}
                        alt={selectedOrder.product_title}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-ink">{selectedOrder.product_title}</p>
                    <p className="text-sm text-muted">Size: {selectedOrder.product_size}</p>
                    <p className="text-sm text-muted mt-1">Order Date: {formatDate(selectedOrder.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Customer</h3>
                <div className="space-y-2 text-sm">
                  <p className="flex items-center gap-2">
                    <User size={16} weight="bold" className="text-accent-start" />
                    {selectedOrder.customer_name}
                  </p>
                  <p className="flex items-center gap-2">
                    <Envelope size={16} weight="bold" className="text-accent-start" />
                    {selectedOrder.customer_email}
                  </p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Shipping Address</h3>
                <div className="bg-surface rounded-lg p-4 text-sm">
                  <p className="font-medium text-ink">{selectedOrder.customer_name}</p>
                  <p className="text-muted mt-1">{selectedOrder.shipping_address}</p>
                  <p className="text-muted">{selectedOrder.shipping_postal_code} {selectedOrder.shipping_city}</p>
                  <p className="text-muted">{selectedOrder.shipping_country}</p>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Pricing</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Original Price:</span>
                    <span className="font-medium">€{selectedOrder.original_price.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount_applied > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Product Discount ({selectedOrder.discount_applied}%):</span>
                      <span>-€{(selectedOrder.original_price * (selectedOrder.discount_applied / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discount_code && (
                    <div className="flex justify-between text-blue-600">
                      <span>Discount Code ({selectedOrder.discount_code}):</span>
                      <span>-€{selectedOrder.discount_code_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-ink text-lg pt-2 border-t border-hairline">
                    <span>Total:</span>
                    <span>€{selectedOrder.final_price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Update Status */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => {
                    const StatusIcon = status.icon;
                    const isActive = selectedOrder.status === status.value;
                    
                    return (
                      <button
                        key={status.value}
                        onClick={() => updateOrderStatus(selectedOrder.id, status.value)}
                        disabled={isActive || isUpdating}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive 
                            ? `${status.color} border cursor-default`
                            : 'border border-hairline hover:border-accent-start hover:bg-accent-start/5'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <StatusIcon size={16} weight="bold" />
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

