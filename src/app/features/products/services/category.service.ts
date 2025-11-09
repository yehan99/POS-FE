import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ProductCategory } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<ProductCategory[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadCategories();
  }

  // Load all categories
  loadCategories(): Observable<ProductCategory[]> {
    return this.http
      .get<ProductCategory[]>(`${environment.apiUrl}/categories`)
      .pipe(tap((categories) => this.categoriesSubject.next(categories)));
  }

  // Get all categories
  getCategories(): Observable<ProductCategory[]> {
    return this.categories$;
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
    return this.http
      .post<ProductCategory>(`${environment.apiUrl}/categories`, category)
      .pipe(tap(() => this.loadCategories().subscribe()));
  }

  // Update category
  updateCategory(
    id: string,
    category: Partial<ProductCategory>
  ): Observable<ProductCategory> {
    return this.http
      .put<ProductCategory>(`${environment.apiUrl}/categories/${id}`, category)
      .pipe(tap(() => this.loadCategories().subscribe()));
  }

  // Delete category
  deleteCategory(id: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/categories/${id}`)
      .pipe(tap(() => this.loadCategories().subscribe()));
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
    return this.http
      .put<void>(`${environment.apiUrl}/categories/reorder`, { categoryIds })
      .pipe(tap(() => this.loadCategories().subscribe()));
  }
}
