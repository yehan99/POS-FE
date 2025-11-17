import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  StockAdjustment,
  StockAdjustmentFormData,
  StockAdjustmentDashboardMetrics,
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
  ProductLookupSummary,
  InventoryDashboardData,
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
    return this.http
      .get<{ data?: StockAdjustment } | StockAdjustment>(
        `${this.apiUrl}/adjustments/${id}`
      )
      .pipe(map((response) => this.unwrapStockAdjustment(response)));
  }

  createStockAdjustment(
    adjustment: StockAdjustmentFormData
  ): Observable<StockAdjustment> {
    return this.http
      .post<{ data?: StockAdjustment } | StockAdjustment>(
        `${this.apiUrl}/adjustments`,
        adjustment
      )
      .pipe(map((response) => this.unwrapStockAdjustment(response)));
  }

  approveStockAdjustment(id: string): Observable<StockAdjustment> {
    return this.http
      .post<{ data?: StockAdjustment } | StockAdjustment>(
        `${this.apiUrl}/adjustments/${id}/approve`,
        {}
      )
      .pipe(map((response) => this.unwrapStockAdjustment(response)));
  }

  rejectStockAdjustment(
    id: string,
    reason: string
  ): Observable<StockAdjustment> {
    return this.http
      .post<{ data?: StockAdjustment } | StockAdjustment>(
        `${this.apiUrl}/adjustments/${id}/reject`,
        { reason }
      )
      .pipe(map((response) => this.unwrapStockAdjustment(response)));
  }

  bulkCreateAdjustments(
    adjustments: StockAdjustmentFormData[]
  ): Observable<StockAdjustment[]> {
    return this.http
      .post<{ data?: StockAdjustment[] } | StockAdjustment[]>(
        `${this.apiUrl}/adjustments/bulk`,
        { adjustments }
      )
      .pipe(map((response) => this.unwrapStockAdjustmentCollection(response)));
  }

  getStockAdjustmentDashboardMetrics(): Observable<StockAdjustmentDashboardMetrics> {
    return this.http
      .get<
        | { data?: StockAdjustmentDashboardMetrics }
        | StockAdjustmentDashboardMetrics
      >(`${this.apiUrl}/adjustments/dashboard`)
      .pipe(
        map((response) => this.unwrapStockAdjustmentDashboardMetrics(response))
      );
  }

  generateStockAdjustmentNumber(): Observable<{ adjustmentNumber: string }> {
    return this.http.get<{ adjustmentNumber: string }>(
      `${this.apiUrl}/adjustments/generate-number`
    );
  }

  searchProducts(term: string, limit = 15): Observable<ProductLookupSummary[]> {
    let params = new HttpParams().set('limit', limit.toString());
    if (term?.trim()) {
      params = params.set('search', term.trim());
    }

    return this.http
      .get<{ data?: ProductLookupSummary[] } | ProductLookupSummary[]>(
        `${environment.apiUrl}/products`,
        { params }
      )
      .pipe(map((response) => this.unwrapProductSummaries(response)));
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
    return this.http
      .get<{ data?: StockTransfer }>(`${this.apiUrl}/stock-transfers/${id}`)
      .pipe(map((response) => this.unwrapStockTransfer(response)));
  }

  createStockTransfer(
    transfer: StockTransferFormData
  ): Observable<StockTransfer> {
    return this.http
      .post<{ data?: StockTransfer }>(
        `${this.apiUrl}/stock-transfers`,
        transfer
      )
      .pipe(map((response) => this.unwrapStockTransfer(response)));
  }

  approveStockTransfer(id: string): Observable<StockTransfer> {
    return this.http
      .post<{ data?: StockTransfer }>(
        `${this.apiUrl}/stock-transfers/${id}/approve`,
        {}
      )
      .pipe(map((response) => this.unwrapStockTransfer(response)));
  }

  shipStockTransfer(id: string): Observable<StockTransfer> {
    return this.http
      .post<{ data?: StockTransfer }>(
        `${this.apiUrl}/stock-transfers/${id}/ship`,
        {}
      )
      .pipe(map((response) => this.unwrapStockTransfer(response)));
  }

  receiveStockTransfer(
    id: string,
    payload:
      | { receivedItems: any[]; receivedBy?: string; notes?: string }
      | any[]
  ): Observable<StockTransfer> {
    const body = Array.isArray(payload)
      ? { receivedItems: payload }
      : {
          receivedItems: payload.receivedItems,
          receivedBy: payload.receivedBy,
          notes: payload.notes,
        };
    return this.http
      .post<{ data?: StockTransfer }>(
        `${this.apiUrl}/stock-transfers/${id}/receive`,
        body
      )
      .pipe(map((response) => this.unwrapStockTransfer(response)));
  }

  cancelStockTransfer(id: string, reason: string): Observable<StockTransfer> {
    return this.http
      .post<{ data?: StockTransfer }>(
        `${this.apiUrl}/stock-transfers/${id}/cancel`,
        { reason }
      )
      .pipe(map((response) => this.unwrapStockTransfer(response)));
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
    if (filters.severity) params = params.set('severity', filters.severity);
    if (filters.locationId)
      params = params.set('location_id', filters.locationId);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());

    return this.http
      .get<{
        success: boolean;
        data: StockAlert[];
        total: number;
        page: number;
        per_page: number;
        total_pages: number;
      }>(`${this.apiUrl}/alerts`, { params })
      .pipe(
        map((response) => ({
          data: response.data,
          total: response.total,
          page: response.page,
          pageSize: response.per_page,
          totalPages: response.total_pages,
          pagination: {
            page: response.page,
            limit: response.per_page,
            total: response.total,
            totalPages: response.total_pages,
            hasNext: response.page < response.total_pages,
            hasPrev: response.page > 1,
          },
        }))
      );
  }

  getAlertsSummary(): Observable<any> {
    return this.http
      .get<{ success: boolean; data: any }>(`${this.apiUrl}/alerts/summary`)
      .pipe(map((response) => response.data));
  }

  acknowledgeAlert(
    id: string,
    acknowledgedBy?: string
  ): Observable<StockAlert> {
    return this.http
      .put<{ success: boolean; data: StockAlert }>(
        `${this.apiUrl}/alerts/${id}/acknowledge`,
        { acknowledged_by: acknowledgedBy }
      )
      .pipe(map((response) => response.data));
  }

  resolveAlert(
    id: string,
    resolvedBy?: string,
    resolutionNotes?: string
  ): Observable<StockAlert> {
    return this.http
      .put<{ success: boolean; data: StockAlert }>(
        `${this.apiUrl}/alerts/${id}/resolve`,
        { resolved_by: resolvedBy, resolution_notes: resolutionNotes }
      )
      .pipe(map((response) => response.data));
  }

  bulkResolveAlerts(
    ids: string[],
    resolvedBy?: string,
    resolutionNotes?: string
  ): Observable<{ count: number }> {
    return this.http
      .post<{ success: boolean; count: number }>(
        `${this.apiUrl}/alerts/bulk-resolve`,
        { ids, resolved_by: resolvedBy, resolution_notes: resolutionNotes }
      )
      .pipe(map((response) => ({ count: response.count })));
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

  // Dashboard
  getDashboardData(alertLimit = 5): Observable<InventoryDashboardData> {
    let params = new HttpParams();
    params = params.set('alert_limit', alertLimit.toString());

    return this.http
      .get<{ success: boolean; data: InventoryDashboardData }>(
        `${this.apiUrl}/dashboard`,
        { params }
      )
      .pipe(map((response) => response.data));
  }

  getDashboardMetrics(): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${this.apiUrl}/dashboard/metrics`
      )
      .pipe(map((response) => response.data));
  }

  getDashboardPipeline(): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${this.apiUrl}/dashboard/pipeline`
      )
      .pipe(map((response) => response.data));
  }

  getDashboardExceptions(): Observable<any[]> {
    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${this.apiUrl}/dashboard/exceptions`
      )
      .pipe(map((response) => response.data));
  }

  getDashboardAlerts(limit = 5): Observable<any[]> {
    let params = new HttpParams();
    params = params.set('limit', limit.toString());

    return this.http
      .get<{ success: boolean; data: any[] }>(
        `${this.apiUrl}/dashboard/alerts`,
        { params }
      )
      .pipe(map((response) => response.data));
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

  private unwrapStockAdjustment(
    response: StockAdjustment | { data?: StockAdjustment | null }
  ): StockAdjustment {
    if (response && typeof response === 'object' && 'data' in response) {
      if (response.data) {
        return response.data;
      }
      throw new Error('Empty stock adjustment payload received from API.');
    }

    return response as StockAdjustment;
  }

  private unwrapStockAdjustmentCollection(
    response: StockAdjustment[] | { data?: StockAdjustment[] | null }
  ): StockAdjustment[] {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data ?? [];
    }

    return response as StockAdjustment[];
  }

  private unwrapProductSummaries(
    response: ProductLookupSummary[] | { data?: ProductLookupSummary[] | null }
  ): ProductLookupSummary[] {
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data ?? [];
    }

    return response as ProductLookupSummary[];
  }

  private unwrapStockTransfer(
    response: { data?: StockTransfer } | StockTransfer
  ): StockTransfer {
    if (response && 'data' in response && response.data) {
      return response.data;
    }

    return response as StockTransfer;
  }

  private unwrapStockAdjustmentDashboardMetrics(
    response:
      | { data?: StockAdjustmentDashboardMetrics }
      | StockAdjustmentDashboardMetrics
      | null
      | undefined
  ): StockAdjustmentDashboardMetrics {
    const payload =
      response && typeof response === 'object' && 'data' in response
        ? response.data ?? {}
        : response ?? {};

    if (!payload || typeof payload !== 'object') {
      return this.buildEmptyStockAdjustmentDashboardMetrics();
    }

    const source = payload as any;

    const statusBreakdownSource = Array.isArray(source.statusBreakdown)
      ? source.statusBreakdown
      : Array.isArray(source.status_breakdown)
      ? source.status_breakdown
      : [];

    const typeBreakdownSource = Array.isArray(source.typeBreakdown)
      ? source.typeBreakdown
      : Array.isArray(source.type_breakdown)
      ? source.type_breakdown
      : [];

    const topReasonsSource = Array.isArray(source.topReasons)
      ? source.topReasons
      : Array.isArray(source.top_reasons)
      ? source.top_reasons
      : [];

    const trendSource = Array.isArray(source.trend)
      ? source.trend
      : Array.isArray(source.timeline)
      ? source.timeline
      : [];

    return {
      totalAdjustments: this.toNumber(
        source.totalAdjustments ?? source.total_adjustments ?? source.total ?? 0
      ),
      pending: this.toNumber(
        source.pending ??
          source.pendingAdjustments ??
          source.pending_adjustments ??
          source.awaitingApproval ??
          source.awaiting_approval ??
          0
      ),
      approved: this.toNumber(
        source.approved ??
          source.approvedAdjustments ??
          source.approved_adjustments ??
          0
      ),
      rejected: this.toNumber(
        source.rejected ??
          source.rejectedAdjustments ??
          source.rejected_adjustments ??
          source.denied ??
          0
      ),
      netQuantityChange: this.toNumber(
        source.netQuantityChange ??
          source.net_quantity_change ??
          source.netQuantity ??
          source.net_quantity ??
          0
      ),
      totalValueAdjusted: this.toNumber(
        source.totalValueAdjusted ??
          source.total_value_adjusted ??
          source.totalValue ??
          source.total_value ??
          0
      ),
      locationsImpacted: this.toNumber(
        source.locationsImpacted ??
          source.locations_impacted ??
          source.uniqueLocations ??
          source.unique_locations ??
          0
      ),
      statusBreakdown: statusBreakdownSource.map((item: any) => ({
        status: item.status ?? item.name ?? 'unknown',
        count: this.toNumber(item.count ?? item.total ?? 0),
        percentage: this.toNumber(item.percentage ?? item.percent ?? 0),
        totalQuantity: this.toNumber(
          item.totalQuantity ?? item.total_quantity ?? item.quantity ?? 0
        ),
        totalValue: this.toNumber(
          item.totalValue ?? item.total_value ?? item.value ?? 0
        ),
      })),
      typeBreakdown: typeBreakdownSource.map((item: any) => ({
        type: item.type ?? item.name ?? 'other',
        count: this.toNumber(item.count ?? item.total ?? 0),
        totalQuantity: this.toNumber(
          item.totalQuantity ?? item.total_quantity ?? item.quantity ?? 0
        ),
        totalValue: this.toNumber(
          item.totalValue ?? item.total_value ?? item.value ?? 0
        ),
      })),
      topReasons: topReasonsSource.map((item: any) => ({
        reason: item.reason ?? item.name ?? 'Other',
        count: this.toNumber(item.count ?? item.total ?? 0),
        percentage: this.toNumber(item.percentage ?? item.percent ?? 0),
      })),
      trend: trendSource.map((item: any) => ({
        label: item.label ?? item.period ?? 'Period',
        adjustments: this.toNumber(
          item.adjustments ?? item.total ?? item.count ?? 0
        ),
        netQuantity: this.toNumber(
          item.netQuantity ?? item.net_quantity ?? item.quantity ?? 0
        ),
        totalValue: this.toNumber(
          item.totalValue ?? item.total_value ?? item.value ?? 0
        ),
      })),
    };
  }

  private buildEmptyStockAdjustmentDashboardMetrics(): StockAdjustmentDashboardMetrics {
    return {
      totalAdjustments: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      netQuantityChange: 0,
      totalValueAdjusted: 0,
      locationsImpacted: 0,
      statusBreakdown: [],
      typeBreakdown: [],
      topReasons: [],
      trend: [],
    };
  }

  private toNumber(value: any, fallback = 0): number {
    if (value === null || value === undefined) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
