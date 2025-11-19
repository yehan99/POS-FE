import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportsService } from '../services/reports.service';
import {
  ReportFilter,
  ReportPeriod,
  SalesReport,
  TopProduct,
  CategorySales,
  PaymentMethodSales,
  DailySales,
  ExportFormat,
} from '../models/report.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-sales-reports',
  standalone: false,
  templateUrl: './sales-reports.component.html',
  styleUrl: './sales-reports.component.scss',
})
export class SalesReportsComponent implements OnInit {
  filterForm!: FormGroup;
  salesReport!: SalesReport;
  isLoading = false;
  readonly skeletonTiles = Array.from({ length: 4 });

  // Table data sources
  topProductsDataSource = new MatTableDataSource<TopProduct>([]);
  categorySalesDataSource = new MatTableDataSource<CategorySales>([]);
  dailySalesDataSource = new MatTableDataSource<DailySales>([]);

  @ViewChild('topProductsPaginator') topProductsPaginator!: MatPaginator;
  @ViewChild('topProductsSort') topProductsSort!: MatSort;

  displayedProductColumns = [
    'productName',
    'sku',
    'quantitySold',
    'revenue',
    'profit',
    'profitMargin',
  ];
  displayedCategoryColumns = [
    'categoryName',
    'totalSales',
    'totalQuantity',
    'percentage',
  ];
  displayedDailyColumns = [
    'date',
    'sales',
    'transactions',
    'averageTransactionValue',
  ];

  reportPeriods: { value: ReportPeriod; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  // Chart data
  categoryChartData: any;
  paymentMethodChartData: any;
  dailySalesChartData: any;
  showCustomDateRange = false;

  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadSalesReport();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      period: ['this_month'],
      startDate: [''],
      endDate: [''],
      categoryId: [''],
      paymentMethod: [''],
    });

    this.filterForm.get('period')?.valueChanges.subscribe((value) => {
      this.showCustomDateRange = value === 'custom';
      if (value !== 'custom') {
        this.filterForm.patchValue({ startDate: '', endDate: '' });
      }
    });

    this.filterForm.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.loadSalesReport();
      });
  }

  loadSalesReport(): void {
    this.isLoading = true;
    const filter = this.buildFilter();

    this.reportsService.getSalesReport(filter).subscribe({
      next: (data) => {
        this.salesReport = data;
        this.updateTableData();
        this.updateChartData();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.loadMockData();
      },
    });
  }

  buildFilter(): ReportFilter {
    const formValue = this.filterForm.value;
    const filter: ReportFilter = {
      period: formValue.period,
    };

    if (
      formValue.period === 'custom' &&
      formValue.startDate &&
      formValue.endDate
    ) {
      filter.dateRange = {
        startDate: new Date(formValue.startDate),
        endDate: new Date(formValue.endDate),
      };
    }

    if (formValue.categoryId) {
      filter.categoryId = formValue.categoryId;
    }

    if (formValue.paymentMethod) {
      filter.paymentMethod = formValue.paymentMethod;
    }

    return filter;
  }

  loadMockData(): void {
    this.salesReport = {
      id: '1',
      reportDate: new Date(),
      totalSales: 3200000,
      totalTransactions: 450,
      averageTransactionValue: 7111,
      totalItems: 1250,
      totalDiscount: 120000,
      totalTax: 160000,
      netSales: 3040000,
      grossProfit: 960000,
      grossProfitMargin: 31.6,
      topSellingProducts: [
        {
          productId: '1',
          productName: 'Premium Rice 5kg',
          sku: 'RICE-001',
          quantitySold: 150,
          revenue: 225000,
          profit: 45000,
          profitMargin: 20,
        },
        {
          productId: '2',
          productName: 'Chicken Curry Mix',
          sku: 'SPICE-045',
          quantitySold: 320,
          revenue: 160000,
          profit: 64000,
          profitMargin: 40,
        },
        {
          productId: '3',
          productName: 'Coconut Oil 1L',
          sku: 'OIL-023',
          quantitySold: 200,
          revenue: 140000,
          profit: 35000,
          profitMargin: 25,
        },
      ],
      salesByCategory: [
        {
          categoryId: '1',
          categoryName: 'Groceries',
          totalSales: 1200000,
          totalQuantity: 500,
          percentage: 37.5,
        },
        {
          categoryId: '2',
          categoryName: 'Spices',
          totalSales: 800000,
          totalQuantity: 350,
          percentage: 25,
        },
        {
          categoryId: '3',
          categoryName: 'Oils',
          totalSales: 600000,
          totalQuantity: 200,
          percentage: 18.75,
        },
        {
          categoryId: '4',
          categoryName: 'Beverages',
          totalSales: 400000,
          totalQuantity: 150,
          percentage: 12.5,
        },
        {
          categoryId: '5',
          categoryName: 'Snacks',
          totalSales: 200000,
          totalQuantity: 50,
          percentage: 6.25,
        },
      ],
      salesByPaymentMethod: [
        {
          paymentMethod: 'Cash',
          amount: 1600000,
          transactionCount: 250,
          percentage: 50,
        },
        {
          paymentMethod: 'Card',
          amount: 1200000,
          transactionCount: 150,
          percentage: 37.5,
        },
        {
          paymentMethod: 'Mobile',
          amount: 400000,
          transactionCount: 50,
          percentage: 12.5,
        },
      ],
      dailyBreakdown: this.generateDailyData(),
    };
    this.updateTableData();
    this.updateChartData();
  }

  generateDailyData(): DailySales[] {
    const data: DailySales[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date,
        sales: Math.floor(Math.random() * 150000) + 50000,
        transactions: Math.floor(Math.random() * 30) + 10,
        averageTransactionValue: Math.floor(Math.random() * 5000) + 3000,
      });
    }
    return data;
  }

  updateTableData(): void {
    this.topProductsDataSource.data = this.salesReport.topSellingProducts;
    this.categorySalesDataSource.data = this.salesReport.salesByCategory;
    this.dailySalesDataSource.data = this.salesReport.dailyBreakdown || [];

    setTimeout(() => {
      this.topProductsDataSource.paginator = this.topProductsPaginator;
      this.topProductsDataSource.sort = this.topProductsSort;
    });
  }

  updateChartData(): void {
    // Category chart data (will be used with a chart library)
    this.categoryChartData = {
      labels: this.salesReport.salesByCategory.map((c) => c.categoryName),
      datasets: [
        {
          data: this.salesReport.salesByCategory.map((c) => c.totalSales),
          backgroundColor: [
            '#667eea',
            '#f093fb',
            '#4facfe',
            '#43e97b',
            '#fa709a',
          ],
        },
      ],
    };

    // Payment method chart data
    this.paymentMethodChartData = {
      labels: this.salesReport.salesByPaymentMethod.map((p) => p.paymentMethod),
      datasets: [
        {
          data: this.salesReport.salesByPaymentMethod.map((p) => p.amount),
          backgroundColor: ['#667eea', '#f093fb', '#4facfe'],
        },
      ],
    };

    // Daily sales chart data
    if (this.salesReport.dailyBreakdown) {
      this.dailySalesChartData = {
        labels: this.salesReport.dailyBreakdown.map((d) =>
          this.formatDate(d.date)
        ),
        datasets: [
          {
            label: 'Sales',
            data: this.salesReport.dailyBreakdown.map((d) => d.sales),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
          },
        ],
      };
    }
  }

  exportReport(format: ExportFormat): void {
    const filter = this.buildFilter();
    this.reportsService
      .exportSalesReport(filter, {
        format,
        includeCharts: true,
        includeDetails: true,
      })
      .subscribe({
        next: (blob) => {
          const fileName = `sales-report-${new Date().getTime()}.${format}`;
          this.reportsService.downloadFile(blob, fileName);
          this.snackBar.open('Report exported successfully', 'Close', {
            duration: 3000,
          });
        },
        error: () => {
          this.snackBar.open('Failed to export report', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
