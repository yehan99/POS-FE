import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  DashboardSummary,
  DashboardKPI,
  SalesTrend,
  CategorySales,
  PaymentMethodSales,
  RecentTransaction,
  InventoryAlert,
  TopSellingProduct,
  TopCustomer,
  DashboardPeriod,
  QuickAction,
  ActivityLog,
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  /**
   * Get complete dashboard summary with all metrics
   */
  getDashboardSummary(
    period: DashboardPeriod = 'today'
  ): Observable<DashboardSummary> {
    const params = new HttpParams().set('period', period);
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`, {
      params,
    });
  }

  /**
   * Get KPI metrics
   */
  getKPIs(period: DashboardPeriod = 'today'): Observable<DashboardKPI> {
    const params = new HttpParams().set('period', period);
    return this.http.get<DashboardKPI>(`${this.apiUrl}/kpis`, { params });
  }

  /**
   * Get sales trend data for chart
   */
  getSalesTrend(period: DashboardPeriod = 'week'): Observable<SalesTrend[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<SalesTrend[]>(`${this.apiUrl}/sales-trend`, {
      params,
    });
  }

  /**
   * Get sales by category
   */
  getCategorySales(
    period: DashboardPeriod = 'month'
  ): Observable<CategorySales[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<CategorySales[]>(`${this.apiUrl}/category-sales`, {
      params,
    });
  }

  /**
   * Get sales by payment method
   */
  getPaymentMethodSales(
    period: DashboardPeriod = 'today'
  ): Observable<PaymentMethodSales[]> {
    const params = new HttpParams().set('period', period);
    return this.http.get<PaymentMethodSales[]>(
      `${this.apiUrl}/payment-method-sales`,
      { params }
    );
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 10): Observable<RecentTransaction[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<RecentTransaction[]>(
      `${this.apiUrl}/recent-transactions`,
      { params }
    );
  }

  /**
   * Get inventory alerts
   */
  getInventoryAlerts(): Observable<InventoryAlert[]> {
    return this.http.get<InventoryAlert[]>(`${this.apiUrl}/inventory-alerts`);
  }

  /**
   * Get top selling products
   */
  getTopProducts(limit: number = 5): Observable<TopSellingProduct[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TopSellingProduct[]>(`${this.apiUrl}/top-products`, {
      params,
    });
  }

  /**
   * Get top customers
   */
  getTopCustomers(limit: number = 5): Observable<TopCustomer[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TopCustomer[]>(`${this.apiUrl}/top-customers`, {
      params,
    });
  }

  /**
   * Get quick actions for dashboard
   */
  getQuickActions(): Observable<QuickAction[]> {
    return of([
      {
        id: '1',
        label: 'New Sale',
        icon: 'point_of_sale',
        route: '/pos',
        color: 'primary',
        description: 'Start a new transaction',
      },
      {
        id: '2',
        label: 'Add Product',
        icon: 'add_box',
        route: '/products/add',
        color: 'accent',
        description: 'Add new product to inventory',
      },
      {
        id: '3',
        label: 'Add Customer',
        icon: 'person_add',
        route: '/customers/add',
        color: 'primary',
        description: 'Register new customer',
      },
      {
        id: '4',
        label: 'View Reports',
        icon: 'assessment',
        route: '/reports',
        color: 'accent',
        description: 'View analytics and reports',
      },
      {
        id: '5',
        label: 'Inventory Check',
        icon: 'inventory_2',
        route: '/inventory',
        color: 'warn',
        description: 'Check stock levels',
      },
      {
        id: '6',
        label: 'Transactions',
        icon: 'receipt_long',
        route: '/pos/transactions',
        color: 'primary',
        description: 'View all transactions',
      },
    ]);
  }

  /**
   * Get recent activity logs
   */
  getActivityLogs(limit: number = 10): Observable<ActivityLog[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<ActivityLog[]>(`${this.apiUrl}/activity-logs`, {
      params,
    });
  }

  /**
   * Generate mock dashboard data for development
   */
  getMockDashboardData(): DashboardSummary {
    const now = new Date();

    return {
      kpis: {
        todaySales: 2850000,
        todaySalesChange: 12.5,
        weekSales: 18500000,
        weekSalesChange: 8.3,
        monthSales: 72000000,
        monthSalesChange: 15.7,
        todayTransactions: 145,
        todayTransactionsChange: 5.2,
        averageOrderValue: 19655,
        averageOrderValueChange: 3.8,
        totalCustomers: 1245,
        totalCustomersChange: 2.1,
        activeCustomers: 856,
        newCustomersToday: 12,
        totalProducts: 456,
        lowStockProducts: 23,
        outOfStockProducts: 7,
        stockValue: 8500000,
      },
      salesTrend: this.generateSalesTrendData(7),
      categorySales: [
        {
          categoryId: '1',
          categoryName: 'Rice & Grains',
          sales: 850000,
          percentage: 32.7,
          color: '#667eea',
        },
        {
          categoryId: '2',
          categoryName: 'Spices',
          sales: 620000,
          percentage: 23.8,
          color: '#f093fb',
        },
        {
          categoryId: '3',
          categoryName: 'Oils',
          sales: 540000,
          percentage: 20.8,
          color: '#4facfe',
        },
        {
          categoryId: '4',
          categoryName: 'Canned Goods',
          sales: 380000,
          percentage: 14.6,
          color: '#43e97b',
        },
        {
          categoryId: '5',
          categoryName: 'Beverages',
          sales: 210000,
          percentage: 8.1,
          color: '#fa709a',
        },
      ],
      paymentMethodSales: [
        { method: 'Cash', amount: 1425000, count: 78, percentage: 50.0 },
        { method: 'Card', amount: 1140000, count: 52, percentage: 40.0 },
        { method: 'Mobile', amount: 285000, count: 15, percentage: 10.0 },
      ],
      recentTransactions: [
        {
          id: 'TXN-2025-001',
          transactionDate: new Date(now.getTime() - 15 * 60000),
          customerName: 'Nimal Perera',
          items: 8,
          amount: 24500,
          paymentMethod: 'Card',
          status: 'completed',
        },
        {
          id: 'TXN-2025-002',
          transactionDate: new Date(now.getTime() - 30 * 60000),
          customerName: 'Kamala Silva',
          items: 5,
          amount: 18750,
          paymentMethod: 'Cash',
          status: 'completed',
        },
        {
          id: 'TXN-2025-003',
          transactionDate: new Date(now.getTime() - 45 * 60000),
          customerName: 'Sunil Fernando',
          items: 12,
          amount: 32000,
          paymentMethod: 'Mobile',
          status: 'completed',
        },
        {
          id: 'TXN-2025-004',
          transactionDate: new Date(now.getTime() - 60 * 60000),
          customerName: 'Anura Dissanayake',
          items: 3,
          amount: 8500,
          paymentMethod: 'Cash',
          status: 'completed',
        },
        {
          id: 'TXN-2025-005',
          transactionDate: new Date(now.getTime() - 75 * 60000),
          customerName: 'Sandya Kumari',
          items: 6,
          amount: 15200,
          paymentMethod: 'Card',
          status: 'completed',
        },
      ],
      inventoryAlerts: [
        {
          productId: '1',
          productName: 'Premium Basmati Rice 5kg',
          sku: 'RICE-001',
          currentStock: 15,
          minStock: 50,
          alertType: 'low_stock',
          severity: 'warning',
        },
        {
          productId: '2',
          productName: 'Coconut Oil 500ml',
          sku: 'OIL-012',
          currentStock: 0,
          minStock: 30,
          alertType: 'out_of_stock',
          severity: 'critical',
        },
        {
          productId: '3',
          productName: 'Curry Powder 100g',
          sku: 'SPICE-045',
          currentStock: 8,
          minStock: 25,
          alertType: 'low_stock',
          severity: 'warning',
        },
        {
          productId: '4',
          productName: 'Dhal (Red) 1kg',
          sku: 'GRAIN-023',
          currentStock: 12,
          minStock: 40,
          alertType: 'low_stock',
          severity: 'warning',
        },
      ],
      topProducts: [
        {
          productId: '1',
          productName: 'Premium Basmati Rice 5kg',
          sku: 'RICE-001',
          quantitySold: 450,
          revenue: 337500,
          profit: 112500,
          profitMargin: 33.3,
          trend: 'up',
        },
        {
          productId: '2',
          productName: 'Chicken Curry Mix',
          sku: 'SPICE-045',
          quantitySold: 680,
          revenue: 272000,
          profit: 95200,
          profitMargin: 35.0,
          trend: 'up',
        },
        {
          productId: '3',
          productName: 'Extra Virgin Coconut Oil',
          sku: 'OIL-012',
          quantitySold: 380,
          revenue: 247000,
          profit: 86450,
          profitMargin: 35.0,
          trend: 'stable',
        },
        {
          productId: '4',
          productName: 'Red Dhal 1kg',
          sku: 'GRAIN-023',
          quantitySold: 520,
          revenue: 208000,
          profit: 62400,
          profitMargin: 30.0,
          trend: 'up',
        },
        {
          productId: '5',
          productName: 'Canned Tuna 185g',
          sku: 'CAN-008',
          quantitySold: 340,
          revenue: 153000,
          profit: 45900,
          profitMargin: 30.0,
          trend: 'down',
        },
      ],
      topCustomers: [
        {
          customerId: '1',
          customerName: 'Nimal Perera',
          email: 'nimal.perera@email.com',
          phone: '+94771234567',
          totalPurchases: 45,
          totalSpent: 450000,
          lastPurchaseDate: new Date(now.getTime() - 15 * 60000),
          tier: 'platinum',
        },
        {
          customerId: '2',
          customerName: 'Kamala Silva',
          email: 'kamala.silva@email.com',
          phone: '+94772345678',
          totalPurchases: 38,
          totalSpent: 380000,
          lastPurchaseDate: new Date(now.getTime() - 2 * 24 * 60 * 60000),
          tier: 'gold',
        },
        {
          customerId: '3',
          customerName: 'Sunil Fernando',
          email: 'sunil.fernando@email.com',
          phone: '+94773456789',
          totalPurchases: 32,
          totalSpent: 320000,
          lastPurchaseDate: new Date(now.getTime() - 3 * 24 * 60 * 60000),
          tier: 'gold',
        },
        {
          customerId: '4',
          customerName: 'Anura Dissanayake',
          email: 'anura.d@email.com',
          phone: '+94774567890',
          totalPurchases: 28,
          totalSpent: 280000,
          lastPurchaseDate: new Date(now.getTime() - 5 * 24 * 60 * 60000),
          tier: 'silver',
        },
        {
          customerId: '5',
          customerName: 'Sandya Kumari',
          email: 'sandya.k@email.com',
          phone: '+94775678901',
          totalPurchases: 25,
          totalSpent: 250000,
          lastPurchaseDate: new Date(now.getTime() - 7 * 24 * 60 * 60000),
          tier: 'silver',
        },
      ],
    };
  }

  /**
   * Generate sales trend data for specified number of days
   */
  private generateSalesTrendData(days: number): SalesTrend[] {
    const trends: SalesTrend[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 1000000) + 2000000,
        transactions: Math.floor(Math.random() * 50) + 100,
      });
    }

    return trends;
  }
}
