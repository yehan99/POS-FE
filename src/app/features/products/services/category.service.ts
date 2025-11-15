import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductCategory, PaginatedResponse } from '../../../core/models';
import { environment } from '../../../../environments/environment';

export interface CategoryMetrics {
  total: number;
  active: number;
  inactive: number;
  nextSortOrder: number;
}

export interface CategoryListResponse {
  data: ProductCategory[];
  pagination: PaginatedResponse<ProductCategory>['pagination'];
  metrics: CategoryMetrics;
}

export interface CategoryQueryParams {
  tenantId?: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  isActive?: boolean;
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  parentId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  // Load categories with pagination support
  loadCategories(
    params: CategoryQueryParams = {}
  ): Observable<CategoryListResponse> {
    const httpParams = this.buildHttpParams(params);

    return this.http.get<CategoryListResponse>(
      `${environment.apiUrl}/categories`,
      { params: httpParams }
    );
  }

  // Get category by ID
  getCategoryById(id: string): Observable<ProductCategory> {
    return this.http.get<ProductCategory>(
      `${environment.apiUrl}/categories/${id}`
    );
  }

  // Create category
  createCategory(
    category: Partial<ProductCategory>
  ): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(
      `${environment.apiUrl}/categories`,
      category
    );
  }

  // Update category
  updateCategory(
    id: string,
    category: Partial<ProductCategory>
  ): Observable<ProductCategory> {
    return this.http.put<ProductCategory>(
      `${environment.apiUrl}/categories/${id}`,
      category
    );
  }

  // Delete category
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/categories/${id}`);
  }

  // Get active categories only
  getActiveCategories(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(
      `${environment.apiUrl}/categories/active`
    );
  }

  // Get category tree (hierarchical structure)
  getCategoryTree(): Observable<ProductCategory[]> {
    return this.http.get<ProductCategory[]>(
      `${environment.apiUrl}/categories/tree`
    );
  }

  // Reorder categories
  reorderCategories(categoryIds: string[]): Observable<void> {
    return this.http.put<void>(`${environment.apiUrl}/categories/reorder`, {
      categoryIds,
    });
  }

  private buildHttpParams(params: CategoryQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (Object.prototype.hasOwnProperty.call(params, 'parentId')) {
      const parentId = params.parentId;
      const serialized = parentId === null ? '' : parentId ?? '';
      // Null parent requests root-level categories.
      httpParams = httpParams.set('parentId', serialized);
    }

    Object.entries(params).forEach(([key, value]) => {
      if (key === 'parentId') {
        return;
      }

      if (value === undefined || value === null || value === '') {
        return;
      }

      if (typeof value === 'number') {
        httpParams = httpParams.set(key, value.toString());
        return;
      }

      if (typeof value === 'boolean') {
        httpParams = httpParams.set(key, value ? 'true' : 'false');
        return;
      }

      httpParams = httpParams.set(key, String(value));
    });

    return httpParams;
  }
}
