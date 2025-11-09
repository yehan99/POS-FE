import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SalesReport,
  SalesSummary,
  InventoryReport,
  CustomerReport,
  ProductPerformanceReport,
  RevenueAnalytics,
  ReportFilter,
  ReportsDashboardSummary,
  ExportOptions,
  PaginatedReportResponse,
  TopProduct,
  TopCustomer,
  StockMovementReport,
  StockValuationReport,
} from '../models/report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportsService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  // ==================== Dashboard ====================
  getDashboardSummary(): Observable<ReportsDashboardSummary> {
    return this.http.get<ReportsDashboardSummary>(
      `${this.apiUrl}/dashboard-summary`
    );
  }

  // ==================== Sales Reports ====================
  getSalesReport(filter: ReportFilter): Observable<SalesReport> {
    const params = this.buildParams(filter);
    return this.http.get<SalesReport>(`${this.apiUrl}/sales`, { params });
  }

  getSalesSummary(): Observable<SalesSummary> {
    return this.http.get<SalesSummary>(`${this.apiUrl}/sales/summary`);
  }

  getTopSellingProducts(
    filter: ReportFilter,
    limit: number = 10
  ): Observable<TopProduct[]> {
    const params = this.buildParams(filter).set('limit', limit.toString());
    return this.http.get<TopProduct[]>(`${this.apiUrl}/sales/top-products`, {
      params,
    });
  }

  getSalesByCategory(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/sales/by-category`, {
      params,
    });
  }

  getSalesByPaymentMethod(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/sales/by-payment-method`, {
      params,
    });
  }

  getDailySales(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/sales/daily`, { params });
  }

  getHourlySales(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/sales/hourly`, { params });
  }

  getSalesTrends(filter: ReportFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/sales/trends`, { params });
  }

  // ==================== Inventory Reports ====================
  getInventoryReport(filter: ReportFilter): Observable<InventoryReport> {
    const params = this.buildParams(filter);
    return this.http.get<InventoryReport>(`${this.apiUrl}/inventory`, {
      params,
    });
  }

  getStockValuation(
    filter: ReportFilter
  ): Observable<PaginatedReportResponse<StockValuationReport>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedReportResponse<StockValuationReport>>(
      `${this.apiUrl}/inventory/stock-valuation`,
      { params }
    );
  }

  getStockMovement(
    filter: ReportFilter
  ): Observable<PaginatedReportResponse<StockMovementReport>> {
    const params = this.buildParams(filter);
    return this.http.get<PaginatedReportResponse<StockMovementReport>>(
      `${this.apiUrl}/inventory/stock-movement`,
      { params }
    );
  }

  getAgingAnalysis(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/inventory/aging-analysis`, {
      params,
    });
  }

  getTopMovingProducts(
    filter: ReportFilter,
    limit: number = 10
  ): Observable<any[]> {
    const params = this.buildParams(filter).set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/inventory/top-moving`, {
      params,
    });
  }

  getSlowMovingProducts(
    filter: ReportFilter,
    limit: number = 10
  ): Observable<any[]> {
    const params = this.buildParams(filter).set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/inventory/slow-moving`, {
      params,
    });
  }

  getInventorySummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/inventory/summary`);
  }

  // ==================== Customer Reports ====================
  getCustomerReport(filter: ReportFilter): Observable<CustomerReport> {
    const params = this.buildParams(filter);
    return this.http.get<CustomerReport>(`${this.apiUrl}/customers`, {
      params,
    });
  }

  getTopCustomers(
    filter: ReportFilter,
    limit: number = 10
  ): Observable<TopCustomer[]> {
    const params = this.buildParams(filter).set('limit', limit.toString());
    return this.http.get<TopCustomer[]>(`${this.apiUrl}/customers/top`, {
      params,
    });
  }

  getCustomersByTier(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/customers/by-tier`, {
      params,
    });
  }

  getCustomerRetention(filter: ReportFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/customers/retention`, {
      params,
    });
  }

  getCustomerAcquisition(filter: ReportFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/customers/acquisition`, {
      params,
    });
  }

  getCustomerLifetimeValue(filter: ReportFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/customers/lifetime-value`, {
      params,
    });
  }

  // ==================== Product Performance ====================
  getProductPerformanceReport(
    filter: ReportFilter
  ): Observable<ProductPerformanceReport> {
    const params = this.buildParams(filter);
    return this.http.get<ProductPerformanceReport>(
      `${this.apiUrl}/products/performance`,
      { params }
    );
  }

  getTopPerformers(
    filter: ReportFilter,
    limit: number = 10
  ): Observable<any[]> {
    const params = this.buildParams(filter).set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/products/top-performers`, {
      params,
    });
  }

  getUnderperformers(
    filter: ReportFilter,
    limit: number = 10
  ): Observable<any[]> {
    const params = this.buildParams(filter).set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/products/underperformers`, {
      params,
    });
  }

  getProfitableProducts(
    filter: ReportFilter,
    limit: number = 10
  ): Observable<any[]> {
    const params = this.buildParams(filter).set('limit', limit.toString());
    return this.http.get<any[]>(`${this.apiUrl}/products/most-profitable`, {
      params,
    });
  }

  getRevenueByCategory(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/products/revenue-by-category`, {
      params,
    });
  }

  getProductTrends(productId: string, filter: ReportFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/products/${productId}/trends`, {
      params,
    });
  }

  // ==================== Revenue Analytics ====================
  getRevenueAnalytics(filter: ReportFilter): Observable<RevenueAnalytics> {
    const params = this.buildParams(filter);
    return this.http.get<RevenueAnalytics>(`${this.apiUrl}/revenue`, {
      params,
    });
  }

  getRevenueByDay(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/revenue/daily`, { params });
  }

  getRevenueByMonth(filter: ReportFilter): Observable<any[]> {
    const params = this.buildParams(filter);
    return this.http.get<any[]>(`${this.apiUrl}/revenue/monthly`, { params });
  }

  getRevenueGrowth(filter: ReportFilter): Observable<any> {
    const params = this.buildParams(filter);
    return this.http.get<any>(`${this.apiUrl}/revenue/growth`, { params });
  }

  // ==================== Export Functions ====================
  exportSalesReport(
    filter: ReportFilter,
    options: ExportOptions
  ): Observable<Blob> {
    const params = this.buildParams(filter)
      .set('format', options.format)
      .set('includeCharts', (options.includeCharts || false).toString())
      .set('includeDetails', (options.includeDetails || false).toString());

    return this.http.get(`${this.apiUrl}/sales/export`, {
      params,
      responseType: 'blob',
    });
  }

  exportInventoryReport(
    filter: ReportFilter,
    options: ExportOptions
  ): Observable<Blob> {
    const params = this.buildParams(filter)
      .set('format', options.format)
      .set('includeCharts', (options.includeCharts || false).toString())
      .set('includeDetails', (options.includeDetails || false).toString());

    return this.http.get(`${this.apiUrl}/inventory/export`, {
      params,
      responseType: 'blob',
    });
  }

  exportCustomerReport(
    filter: ReportFilter,
    options: ExportOptions
  ): Observable<Blob> {
    const params = this.buildParams(filter)
      .set('format', options.format)
      .set('includeCharts', (options.includeCharts || false).toString())
      .set('includeDetails', (options.includeDetails || false).toString());

    return this.http.get(`${this.apiUrl}/customers/export`, {
      params,
      responseType: 'blob',
    });
  }

  exportProductReport(
    filter: ReportFilter,
    options: ExportOptions
  ): Observable<Blob> {
    const params = this.buildParams(filter)
      .set('format', options.format)
      .set('includeCharts', (options.includeCharts || false).toString())
      .set('includeDetails', (options.includeDetails || false).toString());

    return this.http.get(`${this.apiUrl}/products/export`, {
      params,
      responseType: 'blob',
    });
  }

  // ==================== Helper Methods ====================
  private buildParams(filter: ReportFilter): HttpParams {
    let params = new HttpParams().set('period', filter.period);

    if (filter.dateRange) {
      params = params
        .set('startDate', filter.dateRange.startDate.toISOString())
        .set('endDate', filter.dateRange.endDate.toISOString());
    }

    if (filter.productId) {
      params = params.set('productId', filter.productId);
    }

    if (filter.categoryId) {
      params = params.set('categoryId', filter.categoryId);
    }

    if (filter.customerId) {
      params = params.set('customerId', filter.customerId);
    }

    if (filter.locationId) {
      params = params.set('locationId', filter.locationId);
    }

    if (filter.paymentMethod) {
      params = params.set('paymentMethod', filter.paymentMethod);
    }

    if (filter.status) {
      params = params.set('status', filter.status);
    }

    return params;
  }

  downloadFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
