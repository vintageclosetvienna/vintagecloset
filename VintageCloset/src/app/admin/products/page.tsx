'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, 
  MagnifyingGlass, 
  PencilSimple, 
  Trash,
  Funnel,
  X,
  Tag,
  Sparkle
} from '@phosphor-icons/react';
import { DataTable, FormSelect, FormInput, ImageUpload } from '@/components/admin';
import { Button } from '@/components/ui/Button';
import { Product, getDiscountedPrice } from '@/lib/data';
import { supabase, isSupabaseConfigured, DbProduct } from '@/lib/supabase';

const DISCOUNT_OPTIONS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

// Categories based on gender selection
const CATEGORIES_BY_GENDER = {
  women: [
    'Tops', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Skirts',
    'Pants', 'Jeans', 'Shorts', 'Blazers', 'Coats', 'Jackets', 'Knitwear',
    'Loungewear', 'Activewear', 'Swimwear', 'Lingerie', 'Accessories', 'Bags',
    'Shoes', 'Jewelry', 'Scarves', 'Denim', 'Outerwear'
  ],
  men: [
    'T-Shirts', 'Shirts', 'Polos', 'Sweaters', 'Hoodies', 'Sweatshirts',
    'Pants', 'Jeans', 'Shorts', 'Chinos', 'Blazers', 'Suits', 'Coats',
    'Jackets', 'Jerseys', 'Knitwear', 'Activewear', 'Swimwear', 'Underwear',
    'Accessories', 'Bags', 'Shoes', 'Watches', 'Hats', 'Denim', 'Outerwear', 'Footwear'
  ],
  unisex: [
    'T-Shirts', 'Sweatshirts', 'Hoodies', 'Sweaters', 'Pants', 'Jeans',
    'Shorts', 'Jackets', 'Coats', 'Outerwear', 'Sets', 'Tracksuits',
    'Activewear', 'Loungewear', 'Accessories', 'Bags', 'Shoes', 'Hats', 'Scarves', 'Knitwear'
  ],
};

const GENDER_OPTIONS = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'unisex', label: 'Unisex' },
];

const GENDER_FILTER_OPTIONS = [
  { value: '', label: 'All Genders' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'unisex', label: 'Unisex' },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'T-Shirts', label: 'T-Shirts' },
  { value: 'Sweatshirts', label: 'Sweatshirts' },
  { value: 'Jerseys', label: 'Jerseys' },
  { value: 'Pants', label: 'Pants' },
  { value: 'Denim', label: 'Denim' },
  { value: 'Outerwear', label: 'Outerwear' },
  { value: 'Knitwear', label: 'Knitwear' },
  { value: 'Sets', label: 'Sets' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'Footwear', label: 'Footwear' },
];

// Convert DB product to frontend Product type
function dbToProduct(db: DbProduct): Product {
  return {
    id: db.id,
    title: db.title,
    price: `€${db.price.toFixed(2)}`,
    image: db.images[0] || '',
    size: db.size,
    category: db.category,
    era: db.era || undefined,
    slug: db.slug,
    gender: db.gender,
    description: db.description || undefined,
    images: db.images,
    discount: db.discount || undefined,
    isSold: db.is_sold,
  };
}

// Edit Product Modal Component
function EditProductModal({ 
  product, 
  onClose, 
  onSave 
}: { 
  product: Product; 
  onClose: () => void; 
  onSave: (productId: string, data: Partial<Product>) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    title: product.title,
    price: product.price.replace('€', ''),
    size: product.size,
    category: product.category,
    gender: product.gender,
    description: product.description || '',
    images: product.images || [product.image],
    discount: product.discount || 0,
    era: product.era || '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Get available categories based on selected gender
  const availableCategories = useMemo(() => {
    const categories = CATEGORIES_BY_GENDER[formData.gender as keyof typeof CATEGORIES_BY_GENDER] || [];
    return categories.sort().map(cat => ({ value: cat, label: cat }));
  }, [formData.gender]);

  const updateField = (field: string, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate description with GPT
  const handleGenerateDescription = async () => {
    if (!formData.title) {
      setGenerateError('Bitte gib zuerst einen Produktnamen ein.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: formData.title,
          imageUrl: formData.images[0] || null,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setGenerateError(data.error);
      } else if (data.description) {
        updateField('description', data.description);
      }
    } catch (error) {
      setGenerateError('Fehler bei der Verbindung zur API.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(product.id, {
      title: formData.title,
      price: `€${formData.price}`,
      size: formData.size,
      category: formData.category,
      gender: formData.gender as 'men' | 'women' | 'unisex',
      description: formData.description,
      images: formData.images,
      discount: formData.discount,
      era: formData.era,
    });
    setIsSaving(false);
    onClose();
  };

  const isValid = formData.title && formData.price && formData.size && formData.category;

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Stop wheel events from propagating
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          onWheel={handleWheel}
        >
          {/* Header - Fixed */}
          <div className="flex items-center justify-between p-6 border-b border-hairline flex-shrink-0">
            <div>
              <h2 className="font-display font-bold text-xl text-ink">Edit Product</h2>
              <p className="text-sm text-muted mt-1">{product.slug}</p>
            </div>
            <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div 
            className="p-6 space-y-6 flex-1 min-h-0"
            style={{ 
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
          {/* Images */}
          <ImageUpload
            label="Product Images"
            value={formData.images}
            onChange={(urls) => updateField('images', urls)}
            multiple
          />

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Basic Information</h3>
            
            <FormInput
              label="Product Name"
              placeholder="e.g. Vintage 90s Nike Sweatshirt"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink">Description</label>
                <button
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={isGenerating || !formData.title}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-accent-start hover:bg-accent-start/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-accent-start/30 border-t-accent-start rounded-full animate-spin" />
                      Generiere...
                    </>
                  ) : (
                    <>
                      <Sparkle size={14} weight="fill" />
                      Mit KI generieren
                    </>
                  )}
                </button>
              </div>
              <textarea
                placeholder="Describe the product, its condition, history, etc."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all resize-none"
              />
              {generateError && (
                <p className="text-xs text-red-500 mt-2">{generateError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Price"
                type="number"
                placeholder="45.00"
                prefix="€"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                required
              />
              <FormInput
                label="Size"
                placeholder="e.g. M, L, 32/34"
                value={formData.size}
                onChange={(e) => updateField('size', e.target.value)}
                required
              />
            </div>

            <FormInput
              label="Era"
              placeholder="e.g. 90s, Y2K, 80s"
              value={formData.era}
              onChange={(e) => updateField('era', e.target.value)}
            />
          </div>

          {/* Categorization */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Categorization</h3>
            
            <FormSelect
              label="Gender"
              options={GENDER_OPTIONS}
              value={formData.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              required
            />

            <FormSelect
              label="Category"
              options={availableCategories}
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
              placeholder="Select a category"
              required
            />
          </div>

          {/* Discount */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Discount</h3>
            
            <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
              <div className="flex-1">
                <p className="text-sm font-medium text-ink mb-1">Sale Price</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-ink">
                    {formData.discount > 0 ? getDiscountedPrice(`€${formData.price}`, formData.discount) : `€${formData.price}`}
                  </span>
                  {formData.discount > 0 && (
                    <span className="text-sm text-muted line-through">€{formData.price}</span>
                  )}
                </div>
              </div>
              {formData.discount > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted">Customer saves</p>
                  <p className="text-sm font-bold text-green-600">
                    €{(parseFloat(formData.price) * formData.discount / 100).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-6 gap-2">
              {DISCOUNT_OPTIONS.map((discount) => (
                <button
                  key={discount}
                  type="button"
                  onClick={() => updateField('discount', discount)}
                  className={`h-9 rounded-lg text-xs font-bold transition-all ${
                    formData.discount === discount
                      ? 'bg-gradient-to-r from-accent-start to-accent-end text-white shadow-sm'
                      : 'bg-white text-ink hover:bg-accent-start/10 hover:text-accent-start border border-hairline'
                  }`}
                >
                  {discount === 0 ? 'None' : `${discount}%`}
                </button>
              ))}
            </div>
          </div>
        </div>

          {/* Footer - Fixed */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-hairline flex-shrink-0">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={!isValid || isSaving} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteConfirmModal({
  product,
  onClose,
  onConfirm,
  isDeleting,
}: {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="font-display font-bold text-xl text-ink mb-2">Delete Product</h2>
        <p className="text-muted mb-6">
          Are you sure you want to delete <strong>{product.title}</strong>? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>Cancel</Button>
          <Button 
            onClick={onConfirm} 
            isLoading={isDeleting}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setIsLoading(true);
    
    if (!isSupabaseConfigured()) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } else {
      setProducts(data.map(dbToProduct));
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle saving product updates
  const handleSaveProduct = async (productId: string, data: Partial<Product>) => {
    if (!isSupabaseConfigured()) {
      // Update local state only
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...data } : p
      ));
      return;
    }

    // Convert to database format
    const dbData: Partial<DbProduct> = {
      title: data.title,
      price: data.price ? parseFloat(data.price.replace('€', '')) : undefined,
      size: data.size,
      category: data.category,
      gender: data.gender,
      description: data.description,
      images: data.images,
      discount: data.discount || 0,
      era: data.era || null,
    };

    // Remove undefined values
    Object.keys(dbData).forEach(key => {
      if (dbData[key as keyof typeof dbData] === undefined) {
        delete dbData[key as keyof typeof dbData];
      }
    });

    const { error } = await supabase
      .from('products')
      .update(dbData as never)
      .eq('id', productId);

    if (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product. Please try again.');
      return;
    }

    // Update local state
    setProducts(prev => prev.map(p => 
      p.id === productId ? { ...p, ...data } : p
    ));
  };

  // Handle deleting product
  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    
    setIsDeleting(true);

    if (!isSupabaseConfigured()) {
      // Remove from local state only
      setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
      setDeletingProduct(null);
      setIsDeleting(false);
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', deletingProduct.id);

    if (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product. Please try again.');
      setIsDeleting(false);
      return;
    }

    // Remove from local state
    setProducts(prev => prev.filter(p => p.id !== deletingProduct.id));
    setDeletingProduct(null);
    setIsDeleting(false);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(search.toLowerCase());
    const matchesGender = !genderFilter || product.gender === genderFilter;
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesGender && matchesCategory;
  });

  const columns = [
    {
      key: 'image',
      header: 'Image',
      className: 'w-16',
      render: (item: Product) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface">
          <Image 
            src={item.images?.[0] || item.image} 
            alt={item.title} 
            width={48} 
            height={48} 
            className="object-cover w-full h-full"
          />
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Name',
      render: (item: Product) => (
        <div>
          <p className="font-medium text-ink">{item.title}</p>
          <p className="text-xs text-muted mt-0.5">{item.slug}</p>
          {item.isSold && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
              SOLD
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item: Product) => <span className="text-sm">{item.category}</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (item: Product) => (
        <span className="inline-flex px-2 py-1 rounded-md text-xs font-medium bg-surface capitalize">
          {item.gender}
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      render: (item: Product) => <span className="text-sm">{item.size}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      render: (item: Product) => {
        const discount = item.discount || 0;
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {discount > 0 ? getDiscountedPrice(item.price, discount) : item.price}
            </span>
            {discount > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-muted line-through">{item.price}</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                  -{discount}%
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (item: Product) => (
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setEditingProduct(item)}
            className="p-2 text-muted hover:text-accent-start hover:bg-accent-start/10 rounded-lg transition-colors"
            title="Edit Product"
          >
            <PencilSimple size={16} weight="bold" />
          </button>
          <button 
            onClick={() => setDeletingProduct(item)}
            className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Product"
          >
            <Trash size={16} weight="bold" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Products</h1>
          <p className="text-muted mt-1">{products.length} total products</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="gap-2">
            <Plus size={16} weight="bold" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-hairline p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Funnel size={16} className="text-muted" weight="bold" />
          <span className="text-sm font-medium text-muted">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlass 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" 
              weight="bold"
            />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all"
            />
          </div>
          <FormSelect
            options={GENDER_FILTER_OPTIONS}
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            placeholder="Filter by gender"
          />
          <FormSelect
            options={CATEGORY_FILTER_OPTIONS}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Filter by category"
          />
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-hairline p-12 text-center">
          <div className="w-8 h-8 border-2 border-accent-start/30 border-t-accent-start rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading products...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          emptyMessage="No products found"
        />
      )}

      {/* Pagination placeholder */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted">
          Showing {filteredProducts.length} of {products.length} products
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled>Previous</Button>
          <Button variant="ghost" size="sm" disabled>Next</Button>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveProduct}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onClose={() => setDeletingProduct(null)}
          onConfirm={handleDeleteProduct}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
