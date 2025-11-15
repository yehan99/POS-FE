import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Supplier,
  SupplierFormData,
  InventoryFilter,
  PaginatedResponse,
  SupplierDashboardMetrics,
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class SupplierService {
  private readonly apiUrl = `${environment.apiUrl}/suppliers`;
  private readonly suppliersSubject = new BehaviorSubject<Supplier[]>([]);
  readonly suppliers$ = this.suppliersSubject.asObservable();

  constructor(private http: HttpClient) {}

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

    return this.http
      .get<any>(this.apiUrl, { params })
      .pipe(map((response) => this.mapPaginatedSuppliers(response)));
  }

  // Get active suppliers (for dropdowns)
  getActiveSuppliers(): Observable<Supplier[]> {
    return this.http.get<any[]>(`${this.apiUrl}/active`).pipe(
      map((suppliers) =>
        suppliers.map((supplier) => this.mapSupplier(supplier))
      ),
      tap((suppliers) => this.suppliersSubject.next(suppliers))
    );
  }

  // Get supplier by ID
  getSupplierById(id: string): Observable<Supplier> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`)
      .pipe(map((supplier) => this.mapSupplier(supplier)));
  }

  // Create new supplier
  createSupplier(supplier: SupplierFormData): Observable<Supplier> {
    return this.http.post<any>(this.apiUrl, supplier).pipe(
      map((created) => this.mapSupplier(created)),
      tap(() => this.getActiveSuppliers().subscribe())
    );
  }

  updateSupplier(
    id: string,
    supplier: Partial<SupplierFormData>
  ): Observable<Supplier> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, supplier).pipe(
      map((response) => this.mapSupplier(response)),
      tap(() => this.getActiveSuppliers().subscribe())
    );
  }

  deleteSupplier(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.getActiveSuppliers().subscribe()));
  }

  bulkDeleteSuppliers(ids: string[]): Observable<{ deleted: number }> {
    return this.http
      .post<{ deleted: number }>(`${this.apiUrl}/bulk-delete`, { ids })
      .pipe(tap(() => this.getActiveSuppliers().subscribe()));
  }

  generateSupplierCode(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/generate-code`);
  }

  getSupplierStatistics(supplierId: string): Observable<{
    totalPurchaseOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    onTimeDeliveryRate: number;
    pendingOrders: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/${supplierId}/statistics`);
  }

  getSupplierDashboardMetrics(
    period: string = 'this_month'
  ): Observable<SupplierDashboardMetrics> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SupplierDashboardMetrics>(`${this.apiUrl}/dashboard`, {
      params,
    });
  }

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

  exportSuppliers(filters: InventoryFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if ((filters as any).category)
      params = params.set('category', (filters as any).category);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }

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

  private mapPaginatedSuppliers(response: any): PaginatedResponse<Supplier> {
    const dataSource = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response?.data?.data)
      ? response.data.data
      : [];

    const data = dataSource.map((supplier: any) => this.mapSupplier(supplier));
    const total = Number(response?.total ?? data.length);
    const page = Number(response?.page ?? response?.current_page ?? 1);
    const pageSize = Number(
      response?.pageSize ?? response?.per_page ?? (data.length || 1)
    );
    const totalPages = Number(
      response?.totalPages ??
        response?.last_page ??
        (pageSize > 0 ? Math.ceil(total / pageSize) : 1)
    );

    return {
      data,
      total,
      page,
      pageSize,
      totalPages,
    };
  }

  private mapSupplier(resource: any): Supplier {
    const record = resource?.data ?? resource ?? {};

    if (!record || typeof record !== 'object') {
      return this.createEmptySupplier();
    }

    const address = record.address ?? null;
    const bankDetails = record.bankDetails ?? null;
    const monthlyStats = Array.isArray(record.monthlySpendStats)
      ? record.monthlySpendStats.map((entry: any) => ({
          period: entry.period,
          totalSpend: Number(entry.totalSpend ?? entry.total_spend ?? 0),
          purchaseOrders: Number(
            entry.purchaseOrders ?? entry.purchase_orders ?? 0
          ),
          averageLeadTimeDays:
            entry.averageLeadTimeDays !== undefined &&
            entry.averageLeadTimeDays !== null
              ? Number(entry.averageLeadTimeDays)
              : entry.average_lead_time_days !== undefined &&
                entry.average_lead_time_days !== null
              ? Number(entry.average_lead_time_days)
              : null,
        }))
      : null;

    return {
      id: record.id ?? '',
      supplierCode: record.supplierCode ?? record.supplier_code ?? '',
      code: record.code ?? record.supplierCode ?? record.supplier_code ?? '',
      name: record.name ?? '',
      contactPerson: record.contactPerson ?? record.contact_person ?? null,
      email: record.email ?? null,
      phone: record.phone ?? null,
      category: record.category ?? null,
      status: record.status ?? null,
      isActive:
        record.isActive !== undefined && record.isActive !== null
          ? Boolean(record.isActive)
          : record.status
          ? record.status === 'active'
          : true,
      isPreferred: Boolean(record.isPreferred ?? record.is_preferred ?? false),
      paymentTerms: record.paymentTerms ?? record.payment_terms ?? null,
      creditLimit: this.toNumberOrNull(
        record.creditLimit ?? record.credit_limit
      ),
      taxId: record.taxId ?? record.tax_id ?? null,
      website: record.website ?? null,
      address: address
        ? {
            street: address.street ?? address.street_line ?? null,
            city: address.city ?? null,
            state: address.state ?? null,
            postalCode: address.postalCode ?? address.postal_code ?? null,
            country: address.country ?? null,
          }
        : null,
      bankDetails: bankDetails
        ? {
            bankName: bankDetails.bankName ?? bankDetails.bank_name ?? null,
            accountNumber:
              bankDetails.accountNumber ?? bankDetails.account_number ?? null,
            accountName:
              bankDetails.accountName ?? bankDetails.account_name ?? null,
            branchCode: bankDetails.branchCode ?? null,
            swiftCode: bankDetails.swiftCode ?? null,
          }
        : null,
      rating: this.toNumberOrNull(record.rating),
      totalPurchases: this.toNumberOrNull(
        record.totalPurchases ?? record.total_purchases
      ),
      totalSpent: this.toNumberOrNull(record.totalSpent ?? record.total_spent),
      totalOrders: this.toNumberOrNull(
        record.totalOrders ?? record.total_orders
      ),
      spendThisMonth: this.toNumberOrNull(
        record.spendThisMonth ?? record.spend_this_month
      ),
      spendLastMonth: this.toNumberOrNull(
        record.spendLastMonth ?? record.spend_last_month
      ),
      onTimeDeliveryRate: this.toNumberOrNull(
        record.onTimeDeliveryRate ?? record.on_time_delivery_rate
      ),
      averageLeadTimeDays: this.toNumberOrNull(
        record.averageLeadTimeDays ?? record.average_lead_time_days
      ),
      lastPurchaseDate: this.toDateOrNull(
        record.lastPurchaseDate ??
          record.last_purchase_date ??
          record.last_purchase_at
      ),
      monthlySpendStats: monthlyStats,
      notes: record.notes ?? null,
      createdAt: this.toDateOrNull(record.createdAt ?? record.created_at),
      updatedAt: this.toDateOrNull(record.updatedAt ?? record.updated_at),
    };
  }

  private createEmptySupplier(): Supplier {
    return {
      id: '',
      supplierCode: '',
      name: '',
      isActive: false,
      address: null,
      bankDetails: null,
      notes: null,
      rating: null,
      totalPurchases: null,
      totalOrders: null,
      totalSpent: null,
      spendThisMonth: null,
      spendLastMonth: null,
      onTimeDeliveryRate: null,
      averageLeadTimeDays: null,
      lastPurchaseDate: null,
      monthlySpendStats: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private toDateOrNull(value: unknown): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value as string);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
}
