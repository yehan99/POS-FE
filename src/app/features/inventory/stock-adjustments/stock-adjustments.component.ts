import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { InventoryService } from '../services/inventory.service';
import {
  StockAdjustment,
  AdjustmentType,
  Location,
  InventoryFilter,
  StockAdjustmentDashboardMetrics,
  StockAdjustmentReasonBreakdown,
  StockAdjustmentStatusBreakdown,
  StockAdjustmentTypeBreakdown,
} from '../models/inventory.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { StockAdjustmentFormDialogComponent } from './dialogs/stock-adjustment-form-dialog/stock-adjustment-form-dialog.component';
import { RejectStockAdjustmentDialogComponent } from './dialogs/reject-stock-adjustment-dialog/reject-stock-adjustment-dialog.component';

interface MetricCard {
  label: string;
  value: string;
  icon: string;
  accent: 'primary' | 'accent' | 'success' | 'warn' | 'neutral';
  description?: string;
}

@Component({
  selector: 'app-stock-adjustments',
  standalone: false,
  templateUrl: './stock-adjustments.component.html',
  styleUrl: './stock-adjustments.component.scss',
})
export class StockAdjustmentsComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'select',
    'adjustmentNumber',
    'type',
    'product',
    'location',
    'quantity',
    'reason',
    'status',
    'date',
    'actions',
  ];

  dataSource = new MatTableDataSource<StockAdjustment>([]);
  selection = new SelectionModel<StockAdjustment>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;
  dashboardLoading = false;

  totalAdjustments = 0;
  pageSize = 10;
  currentPage = 0;

  adjustmentTypes: AdjustmentType[] = [
    'increase',
    'decrease',
    'damage',
    'loss',
    'found',
    'return',
    'correction',
  ];
  locations: Location[] = [];
  dashboardMetrics?: StockAdjustmentDashboardMetrics;
  metricCards: MetricCard[] = [];
  statusBreakdown: StockAdjustmentStatusBreakdown[] = [];
  typeBreakdown: StockAdjustmentTypeBreakdown[] = [];
  topReasons: StockAdjustmentReasonBreakdown[] = [];

  constructor(
    private inventoryService: InventoryService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadLocations();
    this.loadDashboardMetrics();
    this.loadAdjustments();
  }

  ngAfterViewInit(): void {
    this.attachSort();
    this.syncPaginator();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      type: [''],
      status: [''],
      locationId: [''],
      dateFrom: [''],
      dateTo: [''],
    });

    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadAdjustments();
      });

    this.filterForm.get('type')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadAdjustments();
      this.loadDashboardMetrics();
    });

    this.filterForm.get('status')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadAdjustments();
      this.loadDashboardMetrics();
    });

    this.filterForm.get('locationId')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadAdjustments();
      this.loadDashboardMetrics();
    });
  }

  loadLocations(): void {
    this.inventoryService.getLocations().subscribe({
      next: (locations) => {
        this.locations = locations;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
      },
    });
  }

  loadDashboardMetrics(): void {
    this.dashboardLoading = true;
    this.inventoryService.getStockAdjustmentDashboardMetrics().subscribe({
      next: (metrics) => {
        const normalized = this.normalizeDashboardMetrics(metrics);
        this.dashboardMetrics = normalized;
        this.metricCards = this.buildMetricCards(normalized);
        this.statusBreakdown = normalized.statusBreakdown;
        this.typeBreakdown = normalized.typeBreakdown;
        this.topReasons = normalized.topReasons;
        this.dashboardLoading = false;
      },
      error: (error) => {
        console.error(
          'Error loading stock adjustment dashboard metrics:',
          error
        );
        const fallback = this.buildEmptyDashboardMetrics();
        this.dashboardMetrics = fallback;
        this.metricCards = this.buildMetricCards(fallback);
        this.statusBreakdown = fallback.statusBreakdown;
        this.typeBreakdown = fallback.typeBreakdown;
        this.topReasons = fallback.topReasons;
        this.dashboardLoading = false;
      },
    });
  }

  loadAdjustments(): void {
    this.isLoading = true;
    const filters = this.buildAdjustmentFilters();

    this.inventoryService
      .getStockAdjustments(filters)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          const adjustments = (response.data ?? []).map((item) =>
            this.normalizeAdjustment(item)
          );
          this.dataSource.data = adjustments;

          const pagination = response.pagination ?? {
            page: response.page ?? 1,
            limit: response.pageSize ?? this.pageSize,
            total: response.total ?? this.dataSource.data.length,
            totalPages: response.totalPages ?? 1,
            hasNext: false,
            hasPrev: false,
          };

          this.totalAdjustments =
            pagination.total ?? this.dataSource.data.length;
          this.pageSize = pagination.limit ?? this.pageSize;
          this.currentPage = Math.max((pagination.page ?? 1) - 1, 0);

          this.selection.clear();
          this.attachSort();
          this.syncPaginator();
        },
        error: (error) => {
          console.error('Error loading adjustments:', error);
          this.dataSource.data = [];
          this.snackBar.open('Failed to load adjustments', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAdjustments();
  }

  clearFilters(): void {
    this.filterForm.reset(
      {
        search: '',
        type: '',
        status: '',
        locationId: '',
        dateFrom: '',
        dateTo: '',
      },
      { emitEvent: false }
    );
    this.currentPage = 0;
    this.loadAdjustments();
    this.loadDashboardMetrics();
  }

  applyDateFilter(): void {
    this.currentPage = 0;
    this.loadAdjustments();
    this.loadDashboardMetrics();
  }

  createAdjustment(): void {
    const dialogRef = this.dialog.open(StockAdjustmentFormDialogComponent, {
      width: '640px',
      maxWidth: '90vw',
      data: {
        mode: 'create',
        locations: this.locations,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'saved') {
        this.snackBar.open('Stock adjustment created successfully', 'Close', {
          duration: 3000,
        });
        this.refreshData();
      }
    });
  }

  viewAdjustmentDetails(adjustment: StockAdjustment): void {
    this.inventoryService.getStockAdjustmentById(adjustment.id).subscribe({
      next: (response) => {
        const dialogRef = this.dialog.open(StockAdjustmentFormDialogComponent, {
          width: '640px',
          maxWidth: '90vw',
          data: {
            mode: 'view',
            adjustment: this.normalizeAdjustment(response),
            locations: this.locations,
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          if (result?.action === 'updated') {
            this.refreshData();
          }
        });
      },
      error: (error) => {
        console.error('Error loading adjustment details:', error);
        this.snackBar.open('Failed to load adjustment details', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  approveAdjustment(adjustment: StockAdjustment): void {
    if (
      confirm(
        `Are you sure you want to approve adjustment "${adjustment.adjustmentNumber}"?`
      )
    ) {
      this.inventoryService.approveStockAdjustment(adjustment.id).subscribe({
        next: () => {
          this.snackBar.open('Adjustment approved successfully', 'Close', {
            duration: 3000,
          });
          this.refreshData();
        },
        error: (error) => {
          console.error('Error approving adjustment:', error);
          this.snackBar.open('Failed to approve adjustment', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  rejectAdjustment(adjustment: StockAdjustment): void {
    if (!this.canReject(adjustment)) {
      return;
    }

    const dialogRef = this.dialog.open(RejectStockAdjustmentDialogComponent, {
      width: '520px',
      maxWidth: '90vw',
      data: { adjustment },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action !== 'rejected' || !result.reason) {
        return;
      }

      this.inventoryService
        .rejectStockAdjustment(adjustment.id, result.reason)
        .subscribe({
          next: () => {
            this.snackBar.open('Adjustment rejected successfully', 'Close', {
              duration: 3000,
            });
            this.refreshData();
          },
          error: (error) => {
            console.error('Error rejecting adjustment:', error);
            this.snackBar.open('Failed to reject adjustment', 'Close', {
              duration: 3000,
            });
          },
        });
    });
  }

  bulkApprove(): void {
    const pending = this.selection.selected.filter(
      (a) => a.status === 'pending'
    );
    if (pending.length === 0) {
      this.snackBar.open('No pending adjustments selected', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (confirm(`Approve ${pending.length} adjustment(s)?`)) {
      let completed = 0;
      pending.forEach((adjustment) => {
        this.inventoryService.approveStockAdjustment(adjustment.id).subscribe({
          next: () => {
            completed++;
            if (completed === pending.length) {
              this.snackBar.open(
                `${completed} adjustment(s) approved successfully`,
                'Close',
                { duration: 3000 }
              );
              this.refreshData();
            }
          },
          error: (error) => {
            console.error('Error approving adjustment:', error);
            this.snackBar.open(
              `Failed to approve ${adjustment.adjustmentNumber}`,
              'Close',
              { duration: 3000 }
            );
          },
        });
      });
    }
  }

  exportAdjustments(): void {
    const { page, pageSize, ...filters } = this.buildAdjustmentFilters();

    this.inventoryService.exportStockAdjustments(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock_adjustments_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Adjustments exported successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error exporting adjustments:', error);
        this.snackBar.open('Failed to export adjustments', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  private buildAdjustmentFilters(): InventoryFilter {
    const formValue = this.filterForm.value;

    return {
      search: formValue.search || undefined,
      type: formValue.type || undefined,
      status: formValue.status || undefined,
      locationId: formValue.locationId || undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined,
      page: this.currentPage + 1,
      pageSize: this.pageSize,
    };
  }

  private attachSort(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  private syncPaginator(): void {
    if (!this.paginator) {
      return;
    }

    this.paginator.pageIndex = this.currentPage;
    this.paginator.length = this.totalAdjustments;
    this.paginator.pageSize = this.pageSize;
  }

  private refreshData(): void {
    this.loadAdjustments();
    this.loadDashboardMetrics();
  }

  private normalizeDashboardMetrics(
    metrics?: StockAdjustmentDashboardMetrics | null
  ): StockAdjustmentDashboardMetrics {
    if (!metrics) {
      return this.buildEmptyDashboardMetrics();
    }

    return {
      totalAdjustments: metrics.totalAdjustments ?? 0,
      pending: metrics.pending ?? 0,
      approved: metrics.approved ?? 0,
      rejected: metrics.rejected ?? 0,
      netQuantityChange: metrics.netQuantityChange ?? 0,
      totalValueAdjusted: metrics.totalValueAdjusted ?? 0,
      locationsImpacted: metrics.locationsImpacted ?? 0,
      statusBreakdown: (metrics.statusBreakdown ?? []).map((item) => ({
        status: item.status ?? 'unknown',
        count: item.count ?? 0,
        percentage: item.percentage ?? 0,
        totalQuantity: item.totalQuantity ?? 0,
        totalValue: item.totalValue ?? 0,
      })),
      typeBreakdown: (metrics.typeBreakdown ?? []).map((item) => ({
        type: item.type ?? 'other',
        count: item.count ?? 0,
        totalQuantity: item.totalQuantity ?? 0,
        totalValue: item.totalValue ?? 0,
      })),
      topReasons: (metrics.topReasons ?? []).map((item) => ({
        reason: item.reason ?? 'Other',
        count: item.count ?? 0,
        percentage: item.percentage ?? 0,
      })),
      trend: (metrics.trend ?? []).map((item) => ({
        label: item.label ?? 'Period',
        adjustments: item.adjustments ?? 0,
        netQuantity: item.netQuantity ?? 0,
        totalValue: item.totalValue ?? 0,
      })),
    };
  }

  private buildEmptyDashboardMetrics(): StockAdjustmentDashboardMetrics {
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

  private buildMetricCards(
    metrics: StockAdjustmentDashboardMetrics
  ): MetricCard[] {
    const netQuantity = metrics.netQuantityChange ?? 0;
    const netIcon = netQuantity >= 0 ? 'trending_up' : 'trending_down';
    const netAccent: MetricCard['accent'] =
      netQuantity > 0 ? 'success' : netQuantity < 0 ? 'warn' : 'neutral';

    return [
      {
        label: 'Total Adjustments',
        value: this.formatNumber(metrics.totalAdjustments),
        icon: 'inventory_2',
        accent: 'primary',
        description: `${this.formatNumber(
          metrics.locationsImpacted
        )} locations impacted`,
      },
      {
        label: 'Pending Approval',
        value: this.formatNumber(metrics.pending),
        icon: 'hourglass_top',
        accent: 'accent',
        description: `${this.formatNumber(
          metrics.approved
        )} approved · ${this.formatNumber(metrics.rejected)} rejected`,
      },
      {
        label: 'Net Quantity Change',
        value: this.formatSignedNumber(netQuantity),
        icon: netIcon,
        accent: netAccent,
        description: `${this.formatNumber(
          Math.abs(netQuantity)
        )} units impacted`,
      },
      {
        label: 'Value Adjusted',
        value: this.formatCurrency(metrics.totalValueAdjusted),
        icon: 'account_balance',
        accent: 'neutral',
        description: 'Cumulative stock value impact',
      },
    ];
  }

  private formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '0';
    }

    return new Intl.NumberFormat('en-LK').format(value);
  }

  private formatSignedNumber(value: number | null | undefined): string {
    if (value === null || value === undefined || value === 0) {
      return '0';
    }

    const formatted = this.formatNumber(Math.abs(value));
    return value > 0 ? `+${formatted}` : `-${formatted}`;
  }

  private formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'LKR 0';
    }

    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '0%';
    }

    return `${new Intl.NumberFormat('en-LK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value)}%`;
  }

  getStatusLabel(status: string | null | undefined): string {
    if (!status) {
      return 'Unknown';
    }

    return status
      .split('_')
      .map((segment) =>
        segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : ''
      )
      .join(' ')
      .trim();
  }

  formatTypeLabel(type: string | null | undefined): string {
    if (!type) {
      return 'Other';
    }

    return type
      .split('_')
      .map((segment) =>
        segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : ''
      )
      .join(' ')
      .trim();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  // Utility methods
  getTypeColor(type: AdjustmentType | string): string {
    switch (type) {
      case 'increase':
      case 'found':
      case 'return':
        return '#10b981';
      case 'decrease':
        return '#f59e0b';
      case 'damage':
      case 'loss':
        return '#ef4444';
      case 'correction':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  }

  getTypeIcon(type: AdjustmentType | string): string {
    switch (type) {
      case 'increase':
      case 'found':
        return 'trending_up';
      case 'decrease':
        return 'trending_down';
      case 'damage':
        return 'broken_image';
      case 'loss':
        return 'report';
      case 'return':
        return 'assignment_return';
      case 'correction':
        return 'sync';
      default:
        return 'adjust';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#10b981';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  formatDate(value: string | Date | null | undefined): string {
    if (!value) {
      return 'N/A';
    }

    const parsed = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  canApprove(adjustment: StockAdjustment): boolean {
    return adjustment.status === 'pending';
  }

  canReject(adjustment: StockAdjustment): boolean {
    return adjustment.status === 'pending';
  }

  getQuantityDelta(adjustment: StockAdjustment): number {
    if (typeof adjustment.netQuantity === 'number') {
      return adjustment.netQuantity;
    }

    return this.estimateNetQuantity(adjustment);
  }

  private normalizeAdjustment(adjustment: StockAdjustment): StockAdjustment {
    const netQuantity =
      typeof adjustment.netQuantity === 'number'
        ? adjustment.netQuantity
        : this.estimateNetQuantity(adjustment);

    const netValue =
      typeof adjustment.netValue === 'number'
        ? adjustment.netValue
        : netQuantity * (adjustment.cost ?? 0);

    return {
      ...adjustment,
      netQuantity,
      netValue,
      quantity: Math.abs(adjustment.quantity ?? netQuantity),
      totalValue:
        typeof adjustment.totalValue === 'number'
          ? adjustment.totalValue
          : Math.abs(netValue),
    };
  }

  private estimateNetQuantity(adjustment: StockAdjustment): number {
    const baseQuantity = Math.abs(adjustment.quantity ?? 0);
    const negativeTypes: AdjustmentType[] = ['decrease', 'damage', 'loss'];

    if (negativeTypes.includes(adjustment.adjustmentType)) {
      return -baseQuantity;
    }

    return baseQuantity;
  }
}
