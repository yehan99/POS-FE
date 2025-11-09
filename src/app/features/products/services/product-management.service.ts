import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import {
  Product,
  ProductSearchFilters,
  PaginatedResponse,
} from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductManagementService {
  private productsSubject = new BehaviorSubject<Product[]>([]);
  public products$ = this.productsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all products with filters and pagination
  getProducts(
    filters: ProductSearchFilters = {}
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoryId)
      params = params.set('categoryId', filters.categoryId);
    if (filters.brand) params = params.set('brand', filters.brand);
    if (filters.minPrice)
      params = params.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice)
      params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters.isActive !== undefined)
      params = params.set('isActive', filters.isActive.toString());
    if (filters.inStock !== undefined)
      params = params.set('inStock', filters.inStock.toString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<Product>>(
      `${environment.apiUrl}/products`,
      { params }
    );
  }

  // Get product by ID
  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}/products/${id}`);
  }

  // Create new product
  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products`, product);
  }

  // Update product
  updateProduct(id: string, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(
      `${environment.apiUrl}/products/${id}`,
      product
    );
  }

  // Delete product
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/products/${id}`);
  }

  // Bulk delete products
  bulkDeleteProducts(ids: string[]): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/products/bulk-delete`, {
      ids,
    });
  }

  // Update stock quantity
  updateStock(
    productId: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set'
  ): Observable<Product> {
    return this.http.patch<Product>(
      `${environment.apiUrl}/products/${productId}/stock`,
      {
        quantity,
        operation,
      }
    );
  }

  // Get low stock products
  getLowStockProducts(): Observable<Product[]> {
    return this.http
      .get<{ data: Product[] }>(`${environment.apiUrl}/products/low-stock`)
      .pipe(map((response) => response.data));
  }

  // Get out of stock products
  getOutOfStockProducts(): Observable<Product[]> {
    return this.http
      .get<{ data: Product[] }>(`${environment.apiUrl}/products/out-of-stock`)
      .pipe(map((response) => response.data));
  }

  // Generate SKU
  generateSKU(categoryId?: string): Observable<string> {
    const params = categoryId
      ? new HttpParams().set('categoryId', categoryId)
      : undefined;
    return this.http
      .get<{ sku: string }>(`${environment.apiUrl}/products/generate-sku`, {
        params,
      })
      .pipe(map((response) => response.sku));
  }

  // Generate barcode
  generateBarcode(): Observable<string> {
    return this.http
      .get<{ barcode: string }>(
        `${environment.apiUrl}/products/generate-barcode`
      )
      .pipe(map((response) => response.barcode));
  }

  // Check if SKU exists
  checkSKUExists(sku: string, excludeProductId?: string): Observable<boolean> {
    let params = new HttpParams().set('sku', sku);
    if (excludeProductId) {
      params = params.set('excludeId', excludeProductId);
    }
    return this.http
      .get<{ exists: boolean }>(`${environment.apiUrl}/products/check-sku`, {
        params,
      })
      .pipe(map((response) => response.exists));
  }

  // Check if barcode exists
  checkBarcodeExists(
    barcode: string,
    excludeProductId?: string
  ): Observable<boolean> {
    let params = new HttpParams().set('barcode', barcode);
    if (excludeProductId) {
      params = params.set('excludeId', excludeProductId);
    }
    return this.http
      .get<{ exists: boolean }>(
        `${environment.apiUrl}/products/check-barcode`,
        { params }
      )
      .pipe(map((response) => response.exists));
  }

  // Upload product image
  uploadProductImage(productId: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('image', file);
    return this.http
      .post<{ imageUrl: string }>(
        `${environment.apiUrl}/products/${productId}/upload-image`,
        formData
      )
      .pipe(map((response) => response.imageUrl));
  }

  // Delete product image
  deleteProductImage(productId: string, imageUrl: string): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/products/${productId}/delete-image`,
      { body: { imageUrl } }
    );
  }

  // Bulk import products
  bulkImportProducts(
    file: File
  ): Observable<{ success: number; failed: number; errors: any[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; failed: number; errors: any[] }>(
      `${environment.apiUrl}/products/bulk-import`,
      formData
    );
  }

  // Export products to CSV
  exportProducts(filters: ProductSearchFilters = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.categoryId)
      params = params.set('categoryId', filters.categoryId);
    if (filters.isActive !== undefined)
      params = params.set('isActive', filters.isActive.toString());

    return this.http.get(`${environment.apiUrl}/products/export`, {
      params,
      responseType: 'blob',
    });
  }

  // Get product statistics
  getProductStatistics(): Observable<ProductStatistics> {
    return this.http.get<ProductStatistics>(
      `${environment.apiUrl}/products/statistics`
    );
  }

  // Get brands list
  getBrands(): Observable<string[]> {
    return this.http
      .get<{ brands: string[] }>(`${environment.apiUrl}/products/brands`)
      .pipe(map((response) => response.brands));
  }

  // Get tags list
  getTags(): Observable<string[]> {
    return this.http
      .get<{ tags: string[] }>(`${environment.apiUrl}/products/tags`)
      .pipe(map((response) => response.tags));
  }
}

export interface ProductStatistics {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  averageProductPrice: number;
  categoryCounts: { categoryId: string; categoryName: string; count: number }[];
}
