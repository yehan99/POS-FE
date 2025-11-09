import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportsService } from '../services/reports.service';
import {
  ProductPerformanceReport,
  ProductPerformance,
  CategoryRevenue,
  ReportPeriod,
  ReportFilter,
  ExportFormat,
  ExportOptions,
} from '../models/report.model';

@Component({
  selector: 'app-product-performance',
  standalone: false,
  templateUrl: './product-performance.component.html',
  styleUrl: './product-performance.component.scss',
})
export class ProductPerformanceComponent implements OnInit {
  filterForm!: FormGroup;
  productReport: ProductPerformanceReport | null = null;

  // Top Performers Table
  topPerformersDataSource = new MatTableDataSource<ProductPerformance>();
  @ViewChild('topPerformersPaginator') topPerformersPaginator!: MatPaginator;
  @ViewChild('topPerformersSort') topPerformersSort!: MatSort;
  topPerformersColumns = [
    'productName',
    'sku',
    'quantitySold',
    'revenue',
    'profitMargin',
    'performanceScore',
  ];

  // Underperformers Table
  underperformersDataSource = new MatTableDataSource<ProductPerformance>();
  @ViewChild('underperformersPaginator')
  underperformersPaginator!: MatPaginator;
  @ViewChild('underperformersSort') underperformersSort!: MatSort;
  underperformersColumns = [
    'productName',
    'sku',
    'quantitySold',
    'revenue',
    'profitMargin',
    'returnRate',
  ];

  // Profitable Products Table
  profitableDataSource = new MatTableDataSource<ProductPerformance>();
  @ViewChild('profitablePaginator') profitablePaginator!: MatPaginator;
  @ViewChild('profitableSort') profitableSort!: MatSort;
  profitableColumns = [
    'productName',
    'sku',
    'revenue',
    'profit',
    'profitMargin',
    'roi',
  ];

  isLoading = false;
  showCustomDateRange = false;

  reportPeriods: Array<{ value: ReportPeriod; label: string }> = [
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  // Chart data
  performanceChartData: any;
  revenueChartData: any;
  trendChartData: any;

  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadProductReport();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      period: ['this_month'],
      startDate: [null],
      endDate: [null],
    });

    this.filterForm.get('period')?.valueChanges.subscribe((value) => {
      this.showCustomDateRange = value === 'custom';
      if (value !== 'custom') {
        this.loadProductReport();
      }
    });
  }

  loadProductReport(): void {
    const filter = this.buildFilter();
    this.isLoading = true;

    this.reportsService.getProductPerformanceReport(filter).subscribe({
      next: (report) => {
        this.productReport = report;
        this.updateTableData();
        this.updateChartData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading product report:', error);
        this.loadMockData();
        this.isLoading = false;
        this.snackBar.open('Using sample data for demonstration', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  buildFilter(): ReportFilter {
    const formValue = this.filterForm.value;
    const filter: ReportFilter = {
      period: formValue.period,
    };

    if (formValue.startDate && formValue.endDate) {
      filter.dateRange = {
        startDate: formValue.startDate,
        endDate: formValue.endDate,
      };
    }

    return filter;
  }

  loadMockData(): void {
    this.productReport = {
      id: '1',
      reportDate: new Date(),
      totalProducts: 456,
      activeProducts: 423,
      topPerformers: [
        {
          productId: '1',
          productName: 'Premium Basmati Rice 5kg',
          sku: 'RICE-001',
          category: 'Rice & Grains',
          quantitySold: 450,
          revenue: 337500,
          cost: 225000,
          profit: 112500,
          profitMargin: 33.3,
          performanceScore: 95,
          returnRate: 0.5,
          averageRating: 4.8,
          stockLevel: 150,
        },
        {
          productId: '2',
          productName: 'Chicken Curry Mix',
          sku: 'SPICE-045',
          category: 'Spices',
          quantitySold: 680,
          revenue: 272000,
          cost: 176800,
          profit: 95200,
          profitMargin: 35.0,
          performanceScore: 92,
          returnRate: 0.3,
          averageRating: 4.7,
          stockLevel: 220,
        },
        {
          productId: '3',
          productName: 'Extra Virgin Coconut Oil',
          sku: 'OIL-012',
          category: 'Oils',
          quantitySold: 380,
          revenue: 247000,
          cost: 160550,
          profit: 86450,
          profitMargin: 35.0,
          performanceScore: 88,
          returnRate: 0.2,
          averageRating: 4.9,
          stockLevel: 180,
        },
      ],
      underperformers: [
        {
          productId: '4',
          productName: 'Organic Green Tea',
          sku: 'TEA-008',
          category: 'Beverages',
          quantitySold: 15,
          revenue: 11250,
          cost: 9000,
          profit: 2250,
          profitMargin: 20.0,
          performanceScore: 25,
          returnRate: 8.5,
          averageRating: 3.2,
          stockLevel: 85,
        },
        {
          productId: '5',
          productName: 'Specialty Vinegar',
          sku: 'VIN-003',
          category: 'Condiments',
          quantitySold: 8,
          revenue: 6400,
          cost: 5440,
          profit: 960,
          profitMargin: 15.0,
          performanceScore: 18,
          returnRate: 12.5,
          averageRating: 3.0,
          stockLevel: 92,
        },
      ],
      profitableProducts: [
        {
          productId: '1',
          productName: 'Premium Basmati Rice 5kg',
          sku: 'RICE-001',
          category: 'Rice & Grains',
          quantitySold: 450,
          revenue: 337500,
          cost: 225000,
          profit: 112500,
          profitMargin: 33.3,
          performanceScore: 95,
          returnRate: 0.5,
          averageRating: 4.8,
          stockLevel: 150,
        },
        {
          productId: '2',
          productName: 'Chicken Curry Mix',
          sku: 'SPICE-045',
          category: 'Spices',
          quantitySold: 680,
          revenue: 272000,
          cost: 176800,
          profit: 95200,
          profitMargin: 35.0,
          performanceScore: 92,
          returnRate: 0.3,
          averageRating: 4.7,
          stockLevel: 220,
        },
        {
          productId: '3',
          productName: 'Extra Virgin Coconut Oil',
          sku: 'OIL-012',
          category: 'Oils',
          quantitySold: 380,
          revenue: 247000,
          cost: 160550,
          profit: 86450,
          profitMargin: 35.0,
          performanceScore: 88,
          returnRate: 0.2,
          averageRating: 4.9,
          stockLevel: 180,
        },
      ],
      revenueByCategory: [
        {
          categoryId: '1',
          categoryName: 'Rice & Grains',
          revenue: 850000,
          profit: 280000,
          productCount: 45,
          growthRate: 15.5,
        },
        {
          categoryId: '2',
          categoryName: 'Spices & Seasonings',
          revenue: 620000,
          profit: 217000,
          productCount: 78,
          growthRate: 22.3,
        },
        {
          categoryId: '3',
          categoryName: 'Cooking Oils',
          revenue: 540000,
          profit: 162000,
          productCount: 32,
          growthRate: 18.7,
        },
        {
          categoryId: '4',
          categoryName: 'Canned Goods',
          revenue: 380000,
          profit: 95000,
          productCount: 65,
          growthRate: 8.2,
        },
        {
          categoryId: '5',
          categoryName: 'Beverages',
          revenue: 210000,
          profit: 42000,
          productCount: 43,
          growthRate: -3.5,
        },
      ],
      productTrends: [],
    };

    this.updateTableData();
    this.updateChartData();
  }

  updateTableData(): void {
    if (!this.productReport) return;

    // Top Performers
    this.topPerformersDataSource.data = this.productReport.topPerformers;
    setTimeout(() => {
      this.topPerformersDataSource.paginator = this.topPerformersPaginator;
      this.topPerformersDataSource.sort = this.topPerformersSort;
    });

    // Underperformers
    this.underperformersDataSource.data = this.productReport.underperformers;
    setTimeout(() => {
      this.underperformersDataSource.paginator = this.underperformersPaginator;
      this.underperformersDataSource.sort = this.underperformersSort;
    });

    // Profitable Products
    this.profitableDataSource.data = this.productReport.profitableProducts;
    setTimeout(() => {
      this.profitableDataSource.paginator = this.profitablePaginator;
      this.profitableDataSource.sort = this.profitableSort;
    });
  }

  updateChartData(): void {
    if (!this.productReport) return;

    // Performance Distribution (placeholder for Chart.js)
    this.performanceChartData = {
      labels: ['Top Performers', 'Average', 'Underperformers'],
      datasets: [
        {
          data: [
            this.productReport.topPerformers.length,
            this.productReport.totalProducts -
              this.productReport.topPerformers.length -
              this.productReport.underperformers.length,
            this.productReport.underperformers.length,
          ],
        },
      ],
    };

    // Revenue by Category (placeholder for Chart.js)
    this.revenueChartData = {
      labels: this.productReport.revenueByCategory.map((c) => c.categoryName),
      datasets: [
        {
          label: 'Revenue',
          data: this.productReport.revenueByCategory.map((c) => c.revenue),
        },
      ],
    };
  }

  exportReport(format: ExportFormat): void {
    const filter = this.buildFilter();
    this.isLoading = true;

    const exportOptions: ExportOptions = {
      format: format,
      includeCharts: true,
      includeDetails: true,
    };

    this.reportsService.exportProductReport(filter, exportOptions).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-performance-report.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
        this.snackBar.open(
          `Report exported as ${format.toUpperCase()}`,
          'Close',
          { duration: 3000 }
        );
      },
      error: (error) => {
        console.error('Export error:', error);
        this.isLoading = false;
        this.snackBar.open(
          'Export feature will be available when backend is connected',
          'Close',
          { duration: 3000 }
        );
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

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getTotalRevenue(): number {
    if (!this.productReport) return 0;
    return this.productReport.revenueByCategory.reduce(
      (sum, cat) => sum + cat.revenue,
      0
    );
  }

  getTotalProfit(): number {
    if (!this.productReport) return 0;
    return this.productReport.revenueByCategory.reduce(
      (sum, cat) => sum + cat.profit,
      0
    );
  }

  getAvgProfitMargin(): number {
    const revenue = this.getTotalRevenue();
    if (revenue === 0) return 0;
    return (this.getTotalProfit() / revenue) * 100;
  }
}
