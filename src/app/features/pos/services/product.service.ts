import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  map,
} from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Product, PaginatedResponse } from '../../../core/models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private searchSubject = new Subject<string>();

  // Observable for debounced search results
  public searchResults$: Observable<Product[]>;

  constructor(private http: HttpClient) {
    // Set up debounced search
    this.searchResults$ = this.searchSubject.pipe(
      debounceTime(600), // Wait 600ms after user stops typing
      distinctUntilChanged(), // Only emit if value has changed
      switchMap((searchTerm) => this.searchProducts(searchTerm))
    );
  }

  /**
   * Trigger a product search (will be debounced)
   */
  search(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * Search products by name, SKU, or barcode
   */
  searchProducts(
    query: string,
    page: number = 1,
    limit: number = 20
  ): Observable<Product[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    let params = new HttpParams()
      .set('search', query.trim())
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<{ data: Product[]; pagination: any }>(`${this.apiUrl}`, { params })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Product search error:', error);
          return of([]);
        })
      );
  }

  /**
   * Get product by barcode (for scanner integration)
   */
  getProductByBarcode(barcode: string): Observable<Product | null> {
    return this.http
      .get<{ success: boolean; data: Product }>(
        `${this.apiUrl}/barcode/${barcode}`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Barcode lookup error:', error);
          return of(null);
        })
      );
  }

  /**
   * Get product by ID
   */
  getProductById(id: string): Observable<Product | null> {
    return this.http.get<{ data: Product }>(`${this.apiUrl}/${id}`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Get product error:', error);
        return of(null);
      })
    );
  }

  /**
   * Get all products with pagination
   */
  getProducts(
    page: number = 1,
    limit: number = 50,
    categoryId?: string
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (categoryId) {
      params = params.set('categoryId', categoryId);
    }

    return this.http
      .get<PaginatedResponse<Product>>(this.apiUrl, { params })
      .pipe(
        catchError((error) => {
          console.error('Get products error:', error);
          return of({
            data: [],
            total: 0,
            page: 1,
            pageSize: limit,
            totalPages: 0,
            pagination: {
              page: 1,
              limit: limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          });
        })
      );
  }

  /**
   * Get low stock products
   */
  getLowStockProducts(): Observable<Product[]> {
    return this.http.get<{ data: Product[] }>(`${this.apiUrl}/low-stock`).pipe(
      map((response) => response.data),
      catchError((error) => {
        console.error('Get low stock products error:', error);
        return of([]);
      })
    );
  }

  /**
   * Check product availability
   */
  checkAvailability(productId: string, quantity: number): Observable<boolean> {
    return this.http
      .post<{ available: boolean }>(
        `${this.apiUrl}/${productId}/check-availability`,
        {
          quantity,
        }
      )
      .pipe(
        map((response) => response.available),
        catchError((error) => {
          console.error('Check availability error:', error);
          return of(false);
        })
      );
  }
}
