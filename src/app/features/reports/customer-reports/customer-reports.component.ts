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
  CustomerReport,
  TopCustomer,
  ExportFormat,
} from '../models/report.model';

@Component({
  selector: 'app-customer-reports',
  standalone: false,
  templateUrl: './customer-reports.component.html',
  styleUrl: './customer-reports.component.scss',
})
export class CustomerReportsComponent implements OnInit {
  filterForm!: FormGroup;
  customerReport!: CustomerReport;
  isLoading = false;

  topCustomersDataSource = new MatTableDataSource<TopCustomer>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns = [
    'customerName',
    'email',
    'phone',
    'totalPurchases',
    'totalSpent',
    'averageOrderValue',
    'lastPurchaseDate',
  ];

  reportPeriods: { value: ReportPeriod; label: string }[] = [
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
    this.loadCustomerReport();
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

  loadCustomerReport(): void {
    this.isLoading = true;
    const filter = this.buildFilter();

    this.reportsService.getCustomerReport(filter).subscribe({
      next: (data) => {
        this.customerReport = data;
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
    const filter: ReportFilter = { period: formValue.period };

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
    this.customerReport = {
      id: '1',
      reportDate: new Date(),
      totalCustomers: 1245,
      newCustomers: 156,
      activeCustomers: 856,
      inactiveCustomers: 389,
      topCustomers: [
        {
          customerId: '1',
          customerName: 'Nimal Perera',
          email: 'nimal@example.com',
          phone: '+94771234567',
          totalPurchases: 45,
          totalSpent: 450000,
          averageOrderValue: 10000,
          lastPurchaseDate: new Date(),
          loyaltyPoints: 4500,
        },
        {
          customerId: '2',
          customerName: 'Kamala Silva',
          email: 'kamala@example.com',
          phone: '+94772345678',
          totalPurchases: 38,
          totalSpent: 380000,
          averageOrderValue: 10000,
          lastPurchaseDate: new Date(),
          loyaltyPoints: 3800,
        },
      ],
      customersByTier: [
        {
          tier: 'Platinum',
          customerCount: 45,
          totalSpent: 4500000,
          averageSpent: 100000,
          percentage: 3.6,
        },
        {
          tier: 'Gold',
          customerCount: 120,
          totalSpent: 6000000,
          averageSpent: 50000,
          percentage: 9.6,
        },
        {
          tier: 'Silver',
          customerCount: 350,
          totalSpent: 7000000,
          averageSpent: 20000,
          percentage: 28.1,
        },
        {
          tier: 'Bronze',
          customerCount: 730,
          totalSpent: 7300000,
          averageSpent: 10000,
          percentage: 58.6,
        },
      ],
      customerRetention: {
        retentionRate: 78.5,
        churnRate: 21.5,
        repeatCustomerRate: 65.2,
        newCustomerRate: 12.5,
      },
      averageCustomerValue: 24500,
      customerLifetimeValue: 285000,
    };
    this.updateTableData();
  }

  updateTableData(): void {
    this.topCustomersDataSource.data = this.customerReport.topCustomers;

    setTimeout(() => {
      this.topCustomersDataSource.paginator = this.paginator;
      this.topCustomersDataSource.sort = this.sort;
    });
  }

  exportReport(format: ExportFormat): void {
    const filter = this.buildFilter();
    this.reportsService
      .exportCustomerReport(filter, {
        format,
        includeCharts: true,
        includeDetails: true,
      })
      .subscribe({
        next: (blob) => {
          const fileName = `customer-report-${new Date().getTime()}.${format}`;
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }
}
