export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: ProductCategory;
  brand?: string;
  barcode?: string;
  price: number;
  loyaltyPrice: number;
  costPrice: number;
  taxClass: TaxClass;
  isActive: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  weight?: number;
  dimensions?: ProductDimensions;
  images: string[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  tags: string[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  image?: string;
  tenantId: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  barcode?: string;
  attributes: VariantAttribute[];
  isActive: boolean;
}

export interface ProductAttribute {
  name: string;
  value: string;
  type: AttributeType;
}

export interface VariantAttribute {
  name: string;
  value: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: string;
}

export interface TaxClass {
  id: string;
  name: string;
  rate: number;
  type: TaxType;
  isActive: boolean;
}

export enum AttributeType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
}

export enum TaxType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
  INCLUSIVE = 'inclusive',
  EXCLUSIVE = 'exclusive',
}

export interface ProductSearchFilters {
  search?: string;
  categoryId?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
