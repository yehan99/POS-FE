import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  PurchaseOrder,
  PurchaseOrderFormData,
  PaginatedResponse,
  GoodsReceivedNote,
  PurchaseOrderDashboardMetrics,
  PurchaseOrderStatusBreakdown,
  PurchaseOrderTrendPoint,
  PurchaseOrderTopSupplier,
  PurchaseOrderFilter,
} from '../models/inventory.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderService {
  private readonly apiUrl = `${environment.apiUrl}/purchase-orders`;

  constructor(private http: HttpClient) {}

  // Get all purchase orders with filters
  getPurchaseOrders(
    filters: PurchaseOrderFilter = {}
  ): Observable<PaginatedResponse<PurchaseOrder>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.supplierId)
      params = params.set('supplierId', filters.supplierId);
    const dateFrom = this.toDate(filters.dateFrom);
    const dateTo = this.toDate(filters.dateTo);
    if (dateFrom) params = params.set('dateFrom', dateFrom.toISOString());
    if (dateTo) params = params.set('dateTo', dateTo.toISOString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<PurchaseOrder>>(this.apiUrl, {
      params,
    });
  }

  // Get purchase order by ID
  getPurchaseOrderById(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
  }

  // Create new purchase order
  createPurchaseOrder(po: PurchaseOrderFormData): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(this.apiUrl, po);
  }

  // Update purchase order
  updatePurchaseOrder(
    id: string,
    po: Partial<PurchaseOrderFormData>
  ): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}`, po);
  }

  // Delete purchase order
  deletePurchaseOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Approve purchase order
  approvePurchaseOrder(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Send purchase order to supplier
  sendPurchaseOrder(id: string, email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/send`, { email });
  }

  // Mark as ordered
  markAsOrdered(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/ordered`, {});
  }

  // Receive items (partial or full)
  receivePurchaseOrder(id: string, items: any[]): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/receive`, {
      items,
    });
  }

  // Cancel purchase order
  cancelPurchaseOrder(id: string, reason: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/cancel`, {
      reason,
    });
  }

  // Generate PO number
  generatePONumber(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/generate-number`);
  }

  // Get PO statistics
  getPOStatistics(): Observable<{
    totalPOs: number;
    pendingApproval: number;
    ordered: number;
    partiallyReceived: number;
    received: number;
    totalValue: number;
    avgDeliveryTime: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  getPurchaseOrderDashboardMetrics(): Observable<PurchaseOrderDashboardMetrics> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`).pipe(
      map((response) => this.mapDashboardMetrics(response)),
      catchError(() =>
        this.http.get<any>(`${this.apiUrl}/statistics`).pipe(
          map((stats) => this.mapStatisticsToDashboard(stats)),
          catchError(() => of(this.buildMockDashboardMetrics()))
        )
      )
    );
  }

  // Get GRNs for purchase order
  getGRNsForPO(poId: string): Observable<GoodsReceivedNote[]> {
    return this.http.get<GoodsReceivedNote[]>(`${this.apiUrl}/${poId}/grns`);
  }

  // Export purchase orders to CSV
  exportPurchaseOrders(filters: PurchaseOrderFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.status) params = params.set('status', filters.status);
    if (filters.supplierId)
      params = params.set('supplierId', filters.supplierId);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }

  // Generate PDF for purchase order
  generatePDF(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  // Calculate PO totals
  calculateTotals(
    items: any[],
    discount: number = 0,
    shippingCost: number = 0
  ): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitCost;
      return sum + itemTotal;
    }, 0);

    const tax = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitCost;
      return sum + (itemTotal * (item.tax || 0)) / 100;
    }, 0);

    const total = subtotal + tax - discount + shippingCost;

    return { subtotal, tax, total };
  }

  private mapDashboardMetrics(payload: any): PurchaseOrderDashboardMetrics {
    if (!payload) {
      return this.buildMockDashboardMetrics();
    }

    const totalValue = this.toNumber(payload.totalValue ?? payload.total_value);
    const outstandingValue = this.toNumber(
      payload.outstandingValue ??
        payload.outstanding_value ??
        payload.openValue ??
        payload.open_value ??
        totalValue
    );

    const statusBreakdownSource = Array.isArray(payload.statusBreakdown)
      ? payload.statusBreakdown
      : Array.isArray(payload.status_breakdown)
      ? payload.status_breakdown
      : [];

    const statusBreakdown: PurchaseOrderStatusBreakdown[] =
      statusBreakdownSource.map((item: any) => ({
        status: item.status ?? item.name ?? 'unknown',
        count: this.toNumber(item.count ?? item.total ?? 0),
        percentage: this.toNumber(item.percentage ?? item.percent ?? 0),
        totalValue: this.toNumber(item.totalValue ?? item.total_value ?? 0),
      }));

    const trendSource = Array.isArray(payload.trend)
      ? payload.trend
      : Array.isArray(payload.timeline)
      ? payload.timeline
      : [];

    const trend: PurchaseOrderTrendPoint[] = trendSource.map((item: any) => ({
      label: item.label ?? item.period ?? 'Period',
      totalValue: this.toNumber(item.totalValue ?? item.total_value ?? 0),
      purchaseOrders: this.toNumber(
        item.purchaseOrders ?? item.purchase_orders ?? 0
      ),
    }));

    const topSupplierSource = Array.isArray(payload.topSuppliers)
      ? payload.topSuppliers
      : Array.isArray(payload.top_suppliers)
      ? payload.top_suppliers
      : [];

    const topSuppliers: PurchaseOrderTopSupplier[] = topSupplierSource.map(
      (item: any) => ({
        supplierId: item.supplierId ?? item.supplier_id ?? '',
        supplierName: item.supplierName ?? item.name ?? 'Unknown supplier',
        totalOrders: this.toNumber(item.totalOrders ?? item.orders ?? 0),
        totalValue: this.toNumber(item.totalValue ?? item.total_value ?? 0),
        onTimeRate: this.toNumber(
          item.onTimeRate ?? item.on_time_rate ?? item.onTimeDeliveryRate ?? 0
        ),
        averageLeadTimeDays: this.toNumber(
          item.averageLeadTimeDays ?? item.average_lead_time_days ?? null
        ),
      })
    );

    return {
      totalPurchaseOrders: this.toNumber(
        payload.totalPurchaseOrders ??
          payload.total_orders ??
          payload.total ??
          0
      ),
      pendingApproval: this.toNumber(
        payload.pendingApproval ?? payload.pending_approval ?? 0
      ),
      inProgress: this.toNumber(
        payload.inProgress ?? payload.ordered ?? payload.in_flight ?? 0
      ),
      partiallyReceived: this.toNumber(
        payload.partiallyReceived ??
          payload.partial ??
          payload.partially_received ??
          0
      ),
      received: this.toNumber(payload.received ?? payload.completed ?? 0),
      cancelled: this.toNumber(payload.cancelled ?? payload.canceled ?? 0),
      overdue: this.toNumber(payload.overdue ?? payload.overdueOrders ?? 0),
      totalValue,
      outstandingValue,
      spendThisMonth: this.toNumber(
        payload.spendThisMonth ?? payload.monthSpend ?? payload.month_spend ?? 0
      ),
      spendLastMonth: this.toNumber(
        payload.spendLastMonth ??
          payload.prevMonthSpend ??
          payload.prev_month_spend ??
          0
      ),
      averageCycleTimeDays: this.toNumber(
        payload.averageCycleTimeDays ??
          payload.average_cycle_time_days ??
          payload.avgDeliveryTime ??
          0
      ),
      onTimeFulfillmentRate: this.toNumber(
        payload.onTimeFulfillmentRate ??
          payload.on_time_fulfillment_rate ??
          payload.onTimeRate ??
          0
      ),
      statusBreakdown,
      trend,
      topSuppliers,
    };
  }

  private mapStatisticsToDashboard(stats: any): PurchaseOrderDashboardMetrics {
    if (!stats) {
      return this.buildMockDashboardMetrics();
    }

    const totalPurchaseOrders = this.toNumber(
      stats.totalPOs ?? stats.total ?? 0
    );
    const pendingApproval = this.toNumber(stats.pendingApproval ?? 0);
    const ordered = this.toNumber(stats.ordered ?? 0);
    const partiallyReceived = this.toNumber(stats.partiallyReceived ?? 0);
    const received = this.toNumber(stats.received ?? 0);
    const totalValue = this.toNumber(stats.totalValue ?? 0);
    const avgDeliveryTime = this.toNumber(stats.avgDeliveryTime ?? 0);

    const statusBreakdown: PurchaseOrderStatusBreakdown[] = [
      {
        status: 'pending',
        count: pendingApproval,
        percentage: totalPurchaseOrders
          ? (pendingApproval / totalPurchaseOrders) * 100
          : 0,
        totalValue: 0,
      },
      {
        status: 'ordered',
        count: ordered,
        percentage: totalPurchaseOrders
          ? (ordered / totalPurchaseOrders) * 100
          : 0,
        totalValue: 0,
      },
      {
        status: 'partially_received',
        count: partiallyReceived,
        percentage: totalPurchaseOrders
          ? (partiallyReceived / totalPurchaseOrders) * 100
          : 0,
        totalValue: 0,
      },
      {
        status: 'received',
        count: received,
        percentage: totalPurchaseOrders
          ? (received / totalPurchaseOrders) * 100
          : 0,
        totalValue: 0,
      },
    ];

    return {
      totalPurchaseOrders,
      pendingApproval,
      inProgress: ordered,
      partiallyReceived,
      received,
      cancelled: this.toNumber(stats.cancelled ?? 0),
      overdue: this.toNumber(stats.overdue ?? 0),
      totalValue,
      outstandingValue: totalValue,
      spendThisMonth: this.toNumber(stats.spendThisMonth ?? 0),
      spendLastMonth: this.toNumber(stats.spendLastMonth ?? 0),
      averageCycleTimeDays: avgDeliveryTime,
      onTimeFulfillmentRate: this.toNumber(stats.onTimeFulfillmentRate ?? 0),
      statusBreakdown,
      trend: [],
      topSuppliers: [],
    };
  }

  private buildMockDashboardMetrics(): PurchaseOrderDashboardMetrics {
    const mockStatus: PurchaseOrderStatusBreakdown[] = [
      { status: 'pending', count: 18, percentage: 18, totalValue: 2400000 },
      { status: 'approved', count: 24, percentage: 24, totalValue: 3150000 },
      {
        status: 'ordered',
        count: 22,
        percentage: 22,
        totalValue: 2865000,
      },
      {
        status: 'partially_received',
        count: 12,
        percentage: 12,
        totalValue: 1420000,
      },
      { status: 'received', count: 24, percentage: 24, totalValue: 3650000 },
    ];

    const mockTrend: PurchaseOrderTrendPoint[] = [
      { label: 'May', totalValue: 1850000, purchaseOrders: 26 },
      { label: 'Jun', totalValue: 2045000, purchaseOrders: 29 },
      { label: 'Jul', totalValue: 2120000, purchaseOrders: 31 },
      { label: 'Aug', totalValue: 2365000, purchaseOrders: 34 },
    ];

    const mockTopSuppliers: PurchaseOrderTopSupplier[] = [
      {
        supplierId: 'sup-1',
        supplierName: 'Sunrise Foods Ltd',
        totalOrders: 18,
        totalValue: 1245000,
        onTimeRate: 92,
        averageLeadTimeDays: 5.2,
      },
      {
        supplierId: 'sup-2',
        supplierName: 'Global Electronics Co.',
        totalOrders: 16,
        totalValue: 1100000,
        onTimeRate: 88,
        averageLeadTimeDays: 6.1,
      },
      {
        supplierId: 'sup-3',
        supplierName: 'Lanka Packaging Imports',
        totalOrders: 12,
        totalValue: 890000,
        onTimeRate: 90,
        averageLeadTimeDays: 4.8,
      },
      {
        supplierId: 'sup-4',
        supplierName: 'Evergreen Hardware',
        totalOrders: 10,
        totalValue: 720000,
        onTimeRate: 85,
        averageLeadTimeDays: 7.4,
      },
    ];

    return {
      totalPurchaseOrders: 100,
      pendingApproval: 18,
      inProgress: 46,
      partiallyReceived: 12,
      received: 24,
      cancelled: 6,
      overdue: 5,
      totalValue: 10850000,
      outstandingValue: 4820000,
      spendThisMonth: 2365000,
      spendLastMonth: 2120000,
      averageCycleTimeDays: 8.5,
      onTimeFulfillmentRate: 89,
      statusBreakdown: mockStatus,
      trend: mockTrend,
      topSuppliers: mockTopSuppliers,
    };
  }

  private toDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
  }
}
