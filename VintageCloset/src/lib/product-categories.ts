// Product categories per gender, shared by the admin product forms and the AI autofill route

export type ProductGender = 'women' | 'men' | 'unisex';

export const CATEGORIES_BY_GENDER: Record<ProductGender, string[]> = {
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

export const PRODUCT_GENDERS = Object.keys(CATEGORIES_BY_GENDER) as ProductGender[];

// Fields the AI autofill route returns; empty string means "not recognised"
export interface AiProductDetails {
  title: string;
  description: string;
  size: string;
  era: string;
  gender: ProductGender | '';
  category: string;
}
