'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkle } from '@phosphor-icons/react';
import { 
  ImageUpload, 
  FormInput, 
  FormSelect, 
  FormCheckboxGroup 
} from '@/components/admin';
import { Button } from '@/components/ui/Button';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

interface ProductFormData {
  images: string[];
  title: string;
  description: string;
  price: string;
  size: string;
  genders: string[];
  category: string;
  era: string;
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    images: [],
    title: '',
    description: '',
    price: '',
    size: '',
    genders: [],
    category: '',
    era: '',
  });

  // Get available categories based on selected genders
  const availableCategories = useMemo(() => {
    if (formData.genders.length === 0) return [];
    
    const allCategories = new Set<string>();
    formData.genders.forEach(gender => {
      const categories = CATEGORIES_BY_GENDER[gender as keyof typeof CATEGORIES_BY_GENDER] || [];
      categories.forEach(cat => allCategories.add(cat));
    });
    
    return Array.from(allCategories).sort().map(cat => ({
      value: cat,
      label: cat,
    }));
  }, [formData.genders]);

  const updateField = <K extends keyof ProductFormData>(
    field: K, 
    value: ProductFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Reset category if genders change
    if (field === 'genders') {
      setFormData(prev => ({ ...prev, category: '' }));
    }
  };

  // Generate description with AI
  const handleGenerateDescription = async () => {
    if (!formData.title) {
      setGenerateError('Please enter a product name first.');
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
          imageUrls: formData.images || [],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setGenerateError(data.error);
      } else if (data.description) {
        updateField('description', data.description);
      }
    } catch (error) {
      setGenerateError('Failed to connect to AI service.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // Generate slug
    const slug = generateSlug(formData.title);
    
    // Determine primary gender (first selected, or first one if multiple)
    const primaryGender = formData.genders[0] as 'men' | 'women' | 'unisex';

    if (!isSupabaseConfigured()) {
      // Simulate save for demo
      console.log('Product data (demo mode):', {
        ...formData,
        slug,
        gender: primaryGender,
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/admin/products');
      return;
    }

    // Save to Supabase
    const productData = {
      slug,
      title: formData.title,
      description: formData.description || null,
      price: parseFloat(formData.price),
      discount: 0,
      size: formData.size,
      category: formData.category,
      gender: primaryGender,
      era: formData.era || null,
      images: formData.images,
      is_sold: false,
    };

    const { data, error } = await supabase
      .from('products')
      .insert(productData as never)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      
      // Check for duplicate slug
      if (error.code === '23505') {
        setSubmitError('A product with this name already exists. Please use a different name.');
      } else {
        setSubmitError('Failed to create product. Please try again.');
      }
      setIsSubmitting(false);
      return;
    }

    console.log('Product created:', data);
    router.push('/admin/products');
  };

  const isValid = formData.title && formData.price && formData.size && 
                  formData.genders.length > 0 && formData.category;

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/products" 
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft size={16} weight="bold" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-display font-bold text-ink">Add New Product</h1>
        <p className="text-muted mt-1">Fill in the details to create a new product listing.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Images */}
        <ImageUpload
          label="Product Images"
          value={formData.images}
          onChange={(urls) => updateField('images', urls)}
          multiple
        />

        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Basic Information</h2>
          
          <FormInput
            label="Product Name"
            placeholder="e.g. Vintage 90s Nike Sweatshirt"
            value={formData.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
          />

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-ink">Description</label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !formData.title}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-accent-start hover:bg-accent-start/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate with AI"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-accent-start/30 border-t-accent-start rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkle size={14} weight="fill" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>
            <textarea
              placeholder="Describe the product, its condition, history, etc."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-hairline bg-white text-ink placeholder:text-muted/60 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/20 transition-all resize-none"
            />
            {generateError && (
              <p className="text-xs text-red-500 mt-2">{generateError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              placeholder="e.g. M, L, 32/34, OS"
              value={formData.size}
              onChange={(e) => updateField('size', e.target.value)}
              required
            />
          </div>

          <FormInput
            label="Era (optional)"
            placeholder="e.g. 90s, Y2K, 80s"
            value={formData.era}
            onChange={(e) => updateField('era', e.target.value)}
          />
        </div>

        {/* Categorization */}
        <div className="bg-white rounded-xl border border-hairline p-6 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Categorization</h2>
          
          <FormCheckboxGroup
            label="Gender"
            options={GENDER_OPTIONS}
            value={formData.genders}
            onChange={(value) => updateField('genders', value)}
            required
          />

          <FormSelect
            label="Category"
            options={availableCategories}
            value={formData.category}
            onChange={(e) => updateField('category', e.target.value)}
            placeholder={formData.genders.length === 0 ? "Select gender first" : "Select a category"}
            disabled={formData.genders.length === 0}
            required
          />
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button 
            type="submit" 
            isLoading={isSubmitting}
            disabled={!isValid}
          >
            Save Product
          </Button>
          <Link href="/admin/products">
            <Button type="button" variant="ghost">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
