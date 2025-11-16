import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  StockAdjustment,
  StockAdjustmentFormData,
  StockTransfer,
  StockTransferDashboardMetrics,
  StockTransferFormData,
  StockAlert,
  Location,
  InventoryStatistics,
  InventoryFilter,
  PaginatedResponse,
  StockValuation,
  StockMovement,
  AgingAnalysis,
  GoodsReceivedNote,
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly apiUrl = `${environment.apiUrl}/inventory`;
  private locationsSubject = new BehaviorSubject<Location[]>([]);
  public locations$ = this.locationsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadLocations();
  }

  // Location Management
  loadLocations(): void {
    this.http.get<Location[]>(`${this.apiUrl}/locations`).subscribe({
      next: (locations) => this.locationsSubject.next(locations),
      error: (error) => console.error('Error loading locations:', error),
    });
  }

  getLocations(): Observable<Location[]> {
    return this.http.get<Location[]>(`${this.apiUrl}/locations`);
  }

  getLocationById(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.apiUrl}/locations/${id}`);
  }

  createLocation(location: Partial<Location>): Observable<Location> {
    return this.http
      .post<Location>(`${this.apiUrl}/locations`, location)
      .pipe(tap(() => this.loadLocations()));
  }

  updateLocation(
    id: string,
    location: Partial<Location>
  ): Observable<Location> {
    return this.http
      .put<Location>(`${this.apiUrl}/locations/${id}`, location)
      .pipe(tap(() => this.loadLocations()));
  }

  // Stock Adjustments
  getStockAdjustments(
    filters: InventoryFilter = {}
  ): Observable<PaginatedResponse<StockAdjustment>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.locationId)
      params = params.set('locationId', filters.locationId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<StockAdjustment>>(
      `${this.apiUrl}/adjustments`,
      { params }
    );
  }

  getStockAdjustmentById(id: string): Observable<StockAdjustment> {
    return this.http.get<StockAdjustment>(`${this.apiUrl}/adjustments/${id}`);
  }

  createStockAdjustment(
    adjustment: StockAdjustmentFormData
  ): Observable<StockAdjustment> {
    return this.http.post<StockAdjustment>(
      `${this.apiUrl}/adjustments`,
      adjustment
    );
  }

  approveStockAdjustment(id: string): Observable<StockAdjustment> {
    return this.http.post<StockAdjustment>(
      `${this.apiUrl}/adjustments/${id}/approve`,
      {}
    );
  }

  rejectStockAdjustment(
    id: string,
    reason: string
  ): Observable<StockAdjustment> {
    return this.http.post<StockAdjustment>(
      `${this.apiUrl}/adjustments/${id}/reject`,
      { reason }
    );
  }

  bulkCreateAdjustments(
    adjustments: StockAdjustmentFormData[]
  ): Observable<StockAdjustment[]> {
    return this.http.post<StockAdjustment[]>(
      `${this.apiUrl}/adjustments/bulk`,
      adjustments
    );
  }

  // Stock Transfers
  getStockTransfers(
    filters: InventoryFilter = {}
  ): Observable<PaginatedResponse<StockTransfer>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.locationId)
      params = params.set('locationId', filters.locationId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<PaginatedResponse<StockTransfer>>(
      `${this.apiUrl}/stock-transfers`,
      { params }
    );
  }

  getStockTransferById(id: string): Observable<StockTransfer> {
    return this.http.get<StockTransfer>(`${this.apiUrl}/stock-transfers/${id}`);
  }

  createStockTransfer(
    transfer: StockTransferFormData
  ): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(
      `${this.apiUrl}/stock-transfers`,
      transfer
    );
  }

  approveStockTransfer(id: string): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(
      `${this.apiUrl}/stock-transfers/${id}/approve`,
      {}
    );
  }

  shipStockTransfer(id: string): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(
      `${this.apiUrl}/stock-transfers/${id}/ship`,
      {}
    );
  }

  receiveStockTransfer(
    id: string,
    receivedItems: any[]
  ): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(
      `${this.apiUrl}/stock-transfers/${id}/receive`,
      { receivedItems }
    );
  }

  cancelStockTransfer(id: string, reason: string): Observable<StockTransfer> {
    return this.http.post<StockTransfer>(
      `${this.apiUrl}/stock-transfers/${id}/cancel`,
      { reason }
    );
  }

  generateTransferNumber(): Observable<{ transferNumber: string }> {
    return this.http.get<{ transferNumber: string }>(
      `${this.apiUrl}/stock-transfers/generate-number`
    );
  }

  getStockTransferDashboardMetrics(): Observable<StockTransferDashboardMetrics> {
    return this.http.get<StockTransferDashboardMetrics>(
      `${this.apiUrl}/stock-transfers/dashboard`
    );
  }

  // Stock Alerts
  getStockAlerts(
    filters: InventoryFilter = {}
  ): Observable<PaginatedResponse<StockAlert>> {
    let params = new HttpParams();

    if (filters.type) params = params.set('type', filters.type);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.locationId)
      params = params.set('locationId', filters.locationId);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<PaginatedResponse<StockAlert>>(
      `${this.apiUrl}/alerts`,
      { params }
    );
  }

  acknowledgeAlert(id: string): Observable<StockAlert> {
    return this.http.post<StockAlert>(
      `${this.apiUrl}/alerts/${id}/acknowledge`,
      {}
    );
  }

  resolveAlert(id: string): Observable<StockAlert> {
    return this.http.post<StockAlert>(
      `${this.apiUrl}/alerts/${id}/resolve`,
      {}
    );
  }

  bulkAcknowledgeAlerts(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/alerts/bulk-acknowledge`, {
      ids,
    });
  }

  // Goods Received Notes
  createGRN(
    purchaseOrderId: string,
    items: any[]
  ): Observable<GoodsReceivedNote> {
    return this.http.post<GoodsReceivedNote>(`${this.apiUrl}/grn`, {
      purchaseOrderId,
      items,
    });
  }

  getGRNs(
    filters: InventoryFilter = {}
  ): Observable<PaginatedResponse<GoodsReceivedNote>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());

    return this.http.get<PaginatedResponse<GoodsReceivedNote>>(
      `${this.apiUrl}/grn`,
      { params }
    );
  }

  getGRNById(id: string): Observable<GoodsReceivedNote> {
    return this.http.get<GoodsReceivedNote>(`${this.apiUrl}/grn/${id}`);
  }

  // Reports
  getStockValuation(locationId?: string): Observable<StockValuation[]> {
    let params = new HttpParams();
    if (locationId) params = params.set('locationId', locationId);
    return this.http.get<StockValuation[]>(
      `${this.apiUrl}/reports/stock-valuation`,
      { params }
    );
  }

  getStockMovement(filters: InventoryFilter): Observable<StockMovement[]> {
    let params = new HttpParams();

    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.locationId)
      params = params.set('locationId', filters.locationId);
    if (filters.type) params = params.set('movementType', filters.type);

    return this.http.get<StockMovement[]>(
      `${this.apiUrl}/reports/stock-movement`,
      { params }
    );
  }

  getAgingAnalysis(locationId?: string): Observable<AgingAnalysis[]> {
    let params = new HttpParams();
    if (locationId) params = params.set('locationId', locationId);
    return this.http.get<AgingAnalysis[]>(
      `${this.apiUrl}/reports/aging-analysis`,
      { params }
    );
  }

  // Statistics
  getInventoryStatistics(locationId?: string): Observable<InventoryStatistics> {
    let params = new HttpParams();
    if (locationId) params = params.set('locationId', locationId);
    return this.http.get<InventoryStatistics>(`${this.apiUrl}/statistics`, {
      params,
    });
  }

  // Export
  exportStockAdjustments(filters: InventoryFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());

    return this.http.get(`${this.apiUrl}/adjustments/export`, {
      params,
      responseType: 'blob',
    });
  }

  exportStockTransfers(filters: InventoryFilter = {}): Observable<Blob> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.locationId)
      params = params.set('locationId', filters.locationId);
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());

    return this.http.get(`${this.apiUrl}/stock-transfers/export`, {
      params,
      responseType: 'blob',
    });
  }

  exportStockValuation(locationId?: string): Observable<Blob> {
    let params = new HttpParams();
    if (locationId) params = params.set('locationId', locationId);

    return this.http.get(`${this.apiUrl}/reports/stock-valuation/export`, {
      params,
      responseType: 'blob',
    });
  }
}
