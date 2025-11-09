import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Supplier,
  SupplierFormData,
  InventoryFilter,
  PaginatedResponse,
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private apiUrl = '/api/suppliers';
  private suppliersSubject = new BehaviorSubject<Supplier[]>([]);
  public suppliers$ = this.suppliersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all suppliers with filters
  getSuppliers(
    filters: InventoryFilter = {}
  ): Observable<PaginatedResponse<Supplier>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<Supplier>>(this.apiUrl, { params });
  }

  // Get active suppliers (for dropdowns)
  getActiveSuppliers(): Observable<Supplier[]> {
    return this.http
      .get<Supplier[]>(`${this.apiUrl}/active`)
      .pipe(tap((suppliers) => this.suppliersSubject.next(suppliers)));
  }

  // Get supplier by ID
  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`);
  }

  // Create new supplier
  createSupplier(supplier: SupplierFormData): Observable<Supplier> {
    return this.http
      .post<Supplier>(this.apiUrl, supplier)
      .pipe(tap(() => this.getActiveSuppliers().subscribe()));
  }

  // Update supplier
  updateSupplier(
    id: string,
    supplier: Partial<SupplierFormData>
  ): Observable<Supplier> {
    return this.http
      .put<Supplier>(`${this.apiUrl}/${id}`, supplier)
      .pipe(tap(() => this.getActiveSuppliers().subscribe()));
  }

  // Delete supplier
  deleteSupplier(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.getActiveSuppliers().subscribe()));
  }

  // Bulk delete suppliers
  bulkDeleteSuppliers(ids: string[]): Observable<void> {
    return this.http
      .post<void>(`${this.apiUrl}/bulk-delete`, { ids })
      .pipe(tap(() => this.getActiveSuppliers().subscribe()));
  }

  // Generate supplier code
  generateSupplierCode(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/generate-code`);
  }

  // Get supplier statistics
  getSupplierStatistics(supplierId: string): Observable<{
    totalPurchaseOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
    pendingOrders: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/${supplierId}/statistics`);
  }

  // Get supplier purchase history
  getSupplierPurchaseHistory(
    supplierId: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/${supplierId}/purchase-history`, {
      params,
    });
  }

  // Export suppliers to CSV
  exportSuppliers(filters: InventoryFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }

  // Import suppliers from CSV
  importSuppliers(
    file: File
  ): Observable<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; errors: string[] }>(
      `${this.apiUrl}/import`,
      formData
    );
  }
}
