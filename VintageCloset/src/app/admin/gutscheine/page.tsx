'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Ticket, 
  Pencil, 
  Trash, 
  Check, 
  X,
  Copy,
  CheckCircle,
  Clock,
  Infinity as InfinityIcon,
  Package,
  Tag,
  WarningCircle
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { 
  getAllDiscountCodes, 
  createDiscountCode, 
  updateDiscountCode, 
  deleteDiscountCode,
  toggleDiscountCodeActive,
  type DiscountCode,
  type CreateDiscountCodeData
} from '@/lib/discount-codes';
import { getProducts, type Product } from '@/lib/data';

// Generate random code
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Format date for display
function formatDate(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleDateString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Check if code is expired
function isExpired(code: DiscountCode): boolean {
  if (!code.expiresAt) return false;
  return new Date(code.expiresAt) < new Date();
}

// Check if usage limit reached
function isUsageLimitReached(code: DiscountCode): boolean {
  if (code.usageLimit === null) return false;
  return code.usageCount >= code.usageLimit;
}

interface DiscountFormData {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  usageLimit: string;
  unlimitedUsage: boolean;
  appliesTo: 'all' | 'specific';
  productIds: string[];
  minOrderValue: string;
  noMinimum: boolean;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  noExpiry: boolean;
}

const initialFormData: DiscountFormData = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '10',
  usageLimit: '',
  unlimitedUsage: true,
  appliesTo: 'all',
  productIds: [],
  minOrderValue: '',
  noMinimum: true,
  isActive: true,
  startsAt: new Date().toISOString().split('T')[0],
  expiresAt: '',
  noExpiry: true,
};

export default function GutscheinePage() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [formData, setFormData] = useState<DiscountFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Fetch discount codes and products
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [codes, prods] = await Promise.all([
          getAllDiscountCodes(),
          getProducts()
        ]);
        setDiscountCodes(codes);
        setProducts(prods);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Open form for new code
  const handleNew = () => {
    setEditingCode(null);
    setFormData({
      ...initialFormData,
      code: generateCode(),
    });
    setShowForm(true);
    setError(null);
  };

  // Open form for editing
  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description,
      discountType: code.discountType,
      discountValue: code.discountValue.toString(),
      usageLimit: code.usageLimit?.toString() || '',
      unlimitedUsage: code.usageLimit === null,
      appliesTo: code.appliesTo,
      productIds: code.productIds,
      minOrderValue: code.minOrderValue?.toString() || '',
      noMinimum: code.minOrderValue === null,
      isActive: code.isActive,
      startsAt: code.startsAt.toISOString().split('T')[0],
      expiresAt: code.expiresAt ? code.expiresAt.toISOString().split('T')[0] : '',
      noExpiry: code.expiresAt === null,
    });
    setShowForm(true);
    setError(null);
  };

  // Close form
  const handleClose = () => {
    setShowForm(false);
    setEditingCode(null);
    setFormData(initialFormData);
    setError(null);
  };

  // Save code
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const data: CreateDiscountCodeData = {
        code: formData.code,
        description: formData.description || undefined,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        usageLimit: formData.unlimitedUsage ? null : parseInt(formData.usageLimit) || null,
        appliesTo: formData.appliesTo,
        productIds: formData.appliesTo === 'specific' ? formData.productIds : [],
        minOrderValue: formData.noMinimum ? null : parseFloat(formData.minOrderValue) || null,
        isActive: formData.isActive,
        startsAt: new Date(formData.startsAt),
        expiresAt: formData.noExpiry ? null : formData.expiresAt ? new Date(formData.expiresAt) : null,
      };

      if (editingCode) {
        const updated = await updateDiscountCode(editingCode.id, data);
        if (updated) {
          setDiscountCodes(prev => prev.map(c => c.id === editingCode.id ? updated : c));
        }
      } else {
        const created = await createDiscountCode(data);
        if (created) {
          setDiscountCodes(prev => [created, ...prev]);
        }
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete code
  const handleDelete = async (id: string) => {
    if (!confirm('Gutschein wirklich löschen?')) return;
    
    const success = await deleteDiscountCode(id);
    if (success) {
      setDiscountCodes(prev => prev.filter(c => c.id !== id));
    }
  };

  // Toggle active
  const handleToggleActive = async (code: DiscountCode) => {
    const success = await toggleDiscountCodeActive(code.id, !code.isActive);
    if (success) {
      setDiscountCodes(prev => prev.map(c => 
        c.id === code.id ? { ...c, isActive: !c.isActive } : c
      ));
    }
  };

  // Copy code to clipboard
  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Get status badge
  const getStatusBadge = (code: DiscountCode) => {
    if (!code.isActive) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Inaktiv</span>;
    }
    if (isExpired(code)) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Abgelaufen</span>;
    }
    if (isUsageLimitReached(code)) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Limit erreicht</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Aktiv</span>;
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Gutscheine</h1>
          <p className="text-muted mt-1">Rabattcodes erstellen und verwalten</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus size={18} weight="bold" />
          Neuer Gutschein
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent-start/10 flex items-center justify-center">
              <Ticket size={20} className="text-accent-start" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{discountCodes.length}</p>
              <p className="text-xs text-muted">Gesamt</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-green-600" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {discountCodes.filter(c => c.isActive && !isExpired(c) && !isUsageLimitReached(c)).length}
              </p>
              <p className="text-xs text-muted">Aktiv</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-hairline p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Tag size={20} className="text-blue-600" weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">
                {discountCodes.reduce((sum, c) => sum + c.usageCount, 0)}
              </p>
              <p className="text-xs text-muted">Einlösungen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Codes List */}
      <div className="bg-white rounded-xl border border-hairline overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-accent-start/30 border-t-accent-start rounded-full animate-spin mx-auto" />
          </div>
        ) : discountCodes.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket size={48} className="text-muted/30 mx-auto mb-4" weight="thin" />
            <p className="text-muted">Noch keine Gutscheine erstellt</p>
            <Button variant="ghost" onClick={handleNew} className="mt-4">
              Ersten Gutschein erstellen
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline bg-surface/50">
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Code</th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Rabatt</th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Nutzung</th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Gültig für</th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Gültigkeit</th>
                  <th className="text-left text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted uppercase tracking-wider px-4 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {discountCodes.map((code) => (
                  <tr key={code.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-surface rounded font-mono text-sm font-bold text-ink">
                          {code.code}
                        </code>
                        <button 
                          onClick={() => handleCopy(code.code)}
                          className="p-1 text-muted hover:text-ink transition-colors"
                          title="Code kopieren"
                        >
                          {copiedCode === code.code ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                      {code.description && (
                        <p className="text-xs text-muted mt-1">{code.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-bold text-ink">
                        {code.discountType === 'percentage' 
                          ? `${code.discountValue}%` 
                          : `€${code.discountValue.toFixed(2)}`
                        }
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-ink">{code.usageCount}</span>
                        <span className="text-muted">/</span>
                        {code.usageLimit === null ? (
                          <InfinityIcon size={16} className="text-muted" />
                        ) : (
                          <span className="text-muted">{code.usageLimit}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        {code.appliesTo === 'all' ? (
                          <>
                            <Package size={14} className="text-muted" />
                            <span className="text-muted">Alle Produkte</span>
                          </>
                        ) : (
                          <>
                            <Package size={14} className="text-accent-start" />
                            <span className="text-ink">{code.productIds.length} Produkte</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        {code.expiresAt ? (
                          <div className="flex items-center gap-1.5">
                            <Clock size={14} className="text-muted" />
                            <span className={isExpired(code) ? 'text-red-600' : 'text-muted'}>
                              bis {formatDate(code.expiresAt)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted">Unbegrenzt</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(code)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className={`p-2 rounded-lg transition-colors ${
                            code.isActive 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-muted hover:bg-surface'
                          }`}
                          title={code.isActive ? 'Deaktivieren' : 'Aktivieren'}
                        >
                          {code.isActive ? <CheckCircle size={18} weight="fill" /> : <CheckCircle size={18} />}
                        </button>
                        <button
                          onClick={() => handleEdit(code)}
                          className="p-2 rounded-lg text-muted hover:text-ink hover:bg-surface transition-colors"
                          title="Bearbeiten"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(code.id)}
                          className="p-2 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Löschen"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0">
              <div>
                <h2 className="font-display font-bold text-xl text-ink">
                  {editingCode ? 'Gutschein bearbeiten' : 'Neuer Gutschein'}
                </h2>
              </div>
              <button onClick={handleClose} className="p-2 text-muted hover:text-ink transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>

            {/* Form */}
            <div 
              className="p-6 space-y-6 overflow-y-auto flex-1"
              onWheel={(e) => e.stopPropagation()}
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent',
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: transparent;
                }
                div::-webkit-scrollbar-thumb {
                  background-color: rgba(0, 0, 0, 0.2);
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background-color: rgba(0, 0, 0, 0.3);
                }
              `}</style>
              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <WarningCircle size={18} weight="fill" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Gutscheincode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="z.B. WINTER20"
                    className="flex-1 h-11 px-4 rounded-lg border border-hairline bg-white text-ink font-mono uppercase placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                  />
                  <Button type="button" variant="ghost" onClick={() => setFormData({ ...formData, code: generateCode() })}>
                    Generieren
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Beschreibung (optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="z.B. Winteraktion 2024"
                  className="w-full h-11 px-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Rabattart</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full h-11 px-4 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                  >
                    <option value="percentage">Prozent (%)</option>
                    <option value="fixed">Fixbetrag (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Wert</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                      min="0"
                      step={formData.discountType === 'percentage' ? '1' : '0.01'}
                      max={formData.discountType === 'percentage' ? '100' : undefined}
                      className="w-full h-11 px-4 pr-10 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted">
                      {formData.discountType === 'percentage' ? '%' : '€'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Limit */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Nutzungslimit</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.unlimitedUsage}
                      onChange={(e) => setFormData({ ...formData, unlimitedUsage: e.target.checked })}
                      className="w-4 h-4 rounded border-hairline text-accent-start focus:ring-accent-start/20"
                    />
                    <span className="text-sm text-ink">Unbegrenzt</span>
                  </label>
                  {!formData.unlimitedUsage && (
                    <input
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      min="1"
                      placeholder="Anzahl"
                      className="w-32 h-10 px-3 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                    />
                  )}
                </div>
              </div>

              {/* Applies To */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Gültig für</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="appliesTo"
                      checked={formData.appliesTo === 'all'}
                      onChange={() => setFormData({ ...formData, appliesTo: 'all', productIds: [] })}
                      className="w-4 h-4 border-hairline text-accent-start focus:ring-accent-start/20"
                    />
                    <span className="text-sm text-ink">Alle Produkte</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="appliesTo"
                      checked={formData.appliesTo === 'specific'}
                      onChange={() => setFormData({ ...formData, appliesTo: 'specific' })}
                      className="w-4 h-4 border-hairline text-accent-start focus:ring-accent-start/20"
                    />
                    <span className="text-sm text-ink">Bestimmte Produkte</span>
                  </label>
                </div>
                {formData.appliesTo === 'specific' && products.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto border border-hairline rounded-lg p-2 space-y-1">
                    {products.map(product => (
                      <label key={product.id} className="flex items-center gap-2 p-2 hover:bg-surface rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.productIds.includes(product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, productIds: [...formData.productIds, product.id] });
                            } else {
                              setFormData({ ...formData, productIds: formData.productIds.filter(id => id !== product.id) });
                            }
                          }}
                          className="w-4 h-4 rounded border-hairline text-accent-start focus:ring-accent-start/20"
                        />
                        <span className="text-sm text-ink truncate">{product.title}</span>
                        <span className="text-xs text-muted ml-auto">{product.price}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Minimum Order Value */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Mindestbestellwert</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.noMinimum}
                      onChange={(e) => setFormData({ ...formData, noMinimum: e.target.checked })}
                      className="w-4 h-4 rounded border-hairline text-accent-start focus:ring-accent-start/20"
                    />
                    <span className="text-sm text-ink">Kein Minimum</span>
                  </label>
                  {!formData.noMinimum && (
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-32 h-10 px-3 pr-8 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">€</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Validity Period */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Gültigkeitszeitraum</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted mb-1">Startdatum</label>
                    <input
                      type="date"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Enddatum</label>
                    <div className="flex items-center gap-2">
                      {formData.noExpiry ? (
                        <div className="flex-1 h-10 px-3 rounded-lg border border-hairline bg-surface text-muted flex items-center">
                          Kein Ende
                        </div>
                      ) : (
                        <input
                          type="date"
                          value={formData.expiresAt}
                          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                          min={formData.startsAt}
                          className="flex-1 h-10 px-3 rounded-lg border border-hairline bg-white text-ink focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20"
                        />
                      )}
                      <label className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={formData.noExpiry}
                          onChange={(e) => setFormData({ ...formData, noExpiry: e.target.checked, expiresAt: '' })}
                          className="w-4 h-4 rounded border-hairline text-accent-start focus:ring-accent-start/20"
                        />
                        <span className="text-xs text-muted">∞</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-surface rounded-lg">
                <div>
                  <p className="font-medium text-ink">Sofort aktiv</p>
                  <p className="text-xs text-muted">Gutschein kann sofort verwendet werden</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.isActive ? 'bg-accent-start' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      formData.isActive ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-hairline flex-shrink-0">
              <Button variant="ghost" onClick={handleClose} disabled={isSaving}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={!formData.code || !formData.discountValue || isSaving} isLoading={isSaving}>
                {editingCode ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


