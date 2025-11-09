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
  InventoryReport,
  StockMovementReport,
  StockValuationReport,
  ExportFormat,
} from '../models/report.model';

@Component({
  selector: 'app-inventory-reports',
  standalone: false,
  templateUrl: './inventory-reports.component.html',
  styleUrl: './inventory-reports.component.scss',
})
export class InventoryReportsComponent implements OnInit {
  filterForm!: FormGroup;
  inventoryReport!: InventoryReport;
  isLoading = false;

  stockMovementDataSource = new MatTableDataSource<StockMovementReport>([]);
  stockValuationDataSource = new MatTableDataSource<StockValuationReport>([]);

  @ViewChild('movementPaginator') movementPaginator!: MatPaginator;
  @ViewChild('valuationPaginator') valuationPaginator!: MatPaginator;
  @ViewChild('movementSort') movementSort!: MatSort;
  @ViewChild('valuationSort') valuationSort!: MatSort;

  displayedMovementColumns = [
    'productName',
    'sku',
    'openingStock',
    'stockIn',
    'stockOut',
    'adjustments',
    'closingStock',
    'movementRate',
  ];
  displayedValuationColumns = [
    'productName',
    'sku',
    'quantity',
    'costPrice',
    'sellingPrice',
    'totalCost',
    'totalValue',
    'potentialProfit',
  ];

  reportPeriods: { value: ReportPeriod; label: string }[] = [
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  showCustomDateRange = false;

  constructor(
    private fb: FormBuilder,
    private reportsService: ReportsService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadInventoryReport();
  }

  initializeForm(): void {
    this.filterForm = this.fb.group({
      period: ['this_month'],
      startDate: [''],
      endDate: [''],
    });

    this.filterForm.get('period')?.valueChanges.subscribe((value) => {
      this.showCustomDateRange = value === 'custom';
    });
  }

  loadInventoryReport(): void {
    this.isLoading = true;
    const filter = this.buildFilter();

    this.reportsService.getInventoryReport(filter).subscribe({
      next: (data) => {
        this.inventoryReport = data;
        this.updateTableData();
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

    return filter;
  }

  loadMockData(): void {
    this.inventoryReport = {
      id: '1',
      reportDate: new Date(),
      totalProducts: 456,
      totalStockValue: 8500000,
      totalStockQuantity: 12450,
      lowStockItems: 23,
      outOfStockItems: 7,
      overstockItems: 15,
      stockMovement: [
        {
          productId: '1',
          productName: 'Premium Rice 5kg',
          sku: 'RICE-001',
          openingStock: 150,
          stockIn: 200,
          stockOut: 180,
          adjustments: -5,
          closingStock: 165,
          movementRate: 1.2,
        },
        {
          productId: '2',
          productName: 'Chicken Curry Mix',
          sku: 'SPICE-045',
          openingStock: 300,
          stockIn: 150,
          stockOut: 320,
          adjustments: 0,
          closingStock: 130,
          movementRate: 2.46,
        },
        {
          productId: '3',
          productName: 'Coconut Oil 1L',
          sku: 'OIL-023',
          openingStock: 180,
          stockIn: 100,
          stockOut: 200,
          adjustments: -10,
          closingStock: 70,
          movementRate: 2.86,
        },
      ],
      stockValuation: [
        {
          productId: '1',
          productName: 'Premium Rice 5kg',
          sku: 'RICE-001',
          quantity: 165,
          costPrice: 1200,
          sellingPrice: 1500,
          totalCost: 198000,
          totalValue: 247500,
          potentialProfit: 49500,
        },
        {
          productId: '2',
          productName: 'Chicken Curry Mix',
          sku: 'SPICE-045',
          quantity: 130,
          costPrice: 300,
          sellingPrice: 500,
          totalCost: 39000,
          totalValue: 65000,
          potentialProfit: 26000,
        },
        {
          productId: '3',
          productName: 'Coconut Oil 1L',
          sku: 'OIL-023',
          quantity: 70,
          costPrice: 525,
          sellingPrice: 700,
          totalCost: 36750,
          totalValue: 49000,
          potentialProfit: 12250,
        },
      ],
      agingAnalysis: [
        {
          ageRange: '0-30',
          productCount: 280,
          totalValue: 4200000,
          percentage: 49.4,
        },
        {
          ageRange: '31-60',
          productCount: 120,
          totalValue: 2800000,
          percentage: 33,
        },
        {
          ageRange: '61-90',
          productCount: 40,
          totalValue: 1200000,
          percentage: 14.1,
        },
        {
          ageRange: '90+',
          productCount: 16,
          totalValue: 300000,
          percentage: 3.5,
        },
      ],
      topMovingProducts: [],
      slowMovingProducts: [],
    };
    this.updateTableData();
  }

  updateTableData(): void {
    this.stockMovementDataSource.data = this.inventoryReport.stockMovement;
    this.stockValuationDataSource.data = this.inventoryReport.stockValuation;

    setTimeout(() => {
      this.stockMovementDataSource.paginator = this.movementPaginator;
      this.stockMovementDataSource.sort = this.movementSort;
      this.stockValuationDataSource.paginator = this.valuationPaginator;
      this.stockValuationDataSource.sort = this.valuationSort;
    });
  }

  exportReport(format: ExportFormat): void {
    const filter = this.buildFilter();
    this.reportsService
      .exportInventoryReport(filter, {
        format,
        includeCharts: true,
        includeDetails: true,
      })
      .subscribe({
        next: (blob) => {
          const fileName = `inventory-report-${new Date().getTime()}.${format}`;
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

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
