import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { finalize, debounceTime } from 'rxjs/operators';
import { InventoryService } from '../services/inventory.service';
import {
  InventoryFilter,
  Location,
  StockTransfer,
  StockTransferDashboardMetrics,
  StockTransferStatusBreakdown,
  StockTransferTopLocation,
  StockTransferTrendPoint,
  TransferStatus,
} from '../models/inventory.model';

interface MetricCard {
  label: string;
  value: number;
  icon: string;
  accent: 'primary' | 'accent' | 'warn' | 'neutral';
  description?: string;
}

@Component({
  selector: 'app-stock-transfers',
  standalone: false,
  templateUrl: './stock-transfers.component.html',
  styleUrl: './stock-transfers.component.scss',
})
export class StockTransfersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'select',
    'transferNumber',
    'product',
    'quantity',
    'fromLocation',
    'toLocation',
    'status',
    'requestedDate',
    'actions',
  ];

  dataSource = new MatTableDataSource<StockTransfer>([]);
  selection = new SelectionModel<StockTransfer>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;
  dashboardLoading = false;

  totalTransfers = 0;
  pageSize = 10;
  currentPage = 0;

  transferStatuses: TransferStatus[] = [
    'draft',
    'pending',
    'approved',
    'in_transit',
    'completed',
    'cancelled',
  ];

  locations: Location[] = [];

  dashboardMetrics?: StockTransferDashboardMetrics;
  metricCards: MetricCard[] = [];
  statusBreakdown: StockTransferStatusBreakdown[] = [];
  trendData: StockTransferTrendPoint[] = [];
  topLocations: StockTransferTopLocation[] = [];

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly snackBar: MatSnackBar,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadLocations();
    this.loadDashboardMetrics();
    this.loadTransfers();
  }

  ngAfterViewInit(): void {
    this.attachSort();
    this.syncPaginator();
  }

  private initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      fromLocationId: [''],
      toLocationId: [''],
    });

    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(400))
      .subscribe(() => {
        this.currentPage = 0;
        this.loadTransfers();
      });

    ['status', 'fromLocationId', 'toLocationId'].forEach((controlName) => {
      this.filterForm.get(controlName)?.valueChanges.subscribe(() => {
        this.currentPage = 0;
        this.loadTransfers();
      });
    });
  }

  private loadLocations(): void {
    this.inventoryService.getLocations().subscribe({
      next: (locations) => (this.locations = locations),
      error: (error) =>
        console.error('Error loading inventory locations:', error),
    });
  }

  loadDashboardMetrics(): void {
    this.dashboardLoading = true;
    this.inventoryService.getStockTransferDashboardMetrics().subscribe({
      next: (metrics) => {
        const normalized = this.normalizeDashboardMetrics(metrics);
        this.dashboardMetrics = normalized;
        this.metricCards = this.buildMetricCards(normalized);
        this.statusBreakdown = normalized.statusBreakdown;
        this.trendData = normalized.trend;
        this.topLocations = normalized.topLocations;
        this.dashboardLoading = false;
      },
      error: (error) => {
        console.error('Error loading stock transfer dashboard metrics:', error);
        const fallback = this.buildEmptyDashboardMetrics();
        this.dashboardMetrics = fallback;
        this.metricCards = this.buildMetricCards(fallback);
        this.statusBreakdown = fallback.statusBreakdown;
        this.trendData = fallback.trend;
        this.topLocations = fallback.topLocations;
        this.dashboardLoading = false;
      },
    });
  }

  loadTransfers(): void {
    this.isLoading = true;
    const filters = this.buildTransferFilters();

    this.inventoryService
      .getStockTransfers(filters)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data ?? [];

          const pagination = response.pagination ?? {
            page: response.page ?? 1,
            limit: response.pageSize ?? this.pageSize,
            total: response.total ?? this.dataSource.data.length,
            totalPages: response.totalPages ?? 1,
            hasNext: false,
            hasPrev: false,
          };

          this.totalTransfers = pagination.total ?? this.dataSource.data.length;
          this.pageSize = pagination.limit ?? this.pageSize;
          this.currentPage = Math.max((pagination.page ?? 1) - 1, 0);

          this.selection.clear();
          this.attachSort();
          this.syncPaginator();
        },
        error: (error) => {
          console.error('Error loading stock transfers:', error);
          this.dataSource.data = [];
          this.snackBar.open('Failed to load stock transfers', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransfers();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      status: '',
      fromLocationId: '',
      toLocationId: '',
    });
    this.currentPage = 0;
    this.loadTransfers();
  }

  createTransfer(): void {
    this.snackBar.open('Transfer creation coming soon', 'Close', {
      duration: 2500,
    });
  }

  exportTransfers(): void {
    const filters = this.buildTransferFilters();
    delete filters.page;
    delete filters.pageSize;

    this.inventoryService.exportStockTransfers(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `stock_transfers_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Transfers exported successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error exporting stock transfers:', error);
        this.snackBar.open('Failed to export stock transfers', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  bulkApprove(): void {
    const pendingTransfers = this.selection.selected.filter(
      (transfer) => transfer.status === 'pending'
    );

    if (pendingTransfers.length === 0) {
      this.snackBar.open('No pending transfers selected', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (
      !confirm(
        `Approve ${pendingTransfers.length} transfer(s)? Other statuses will be skipped.`
      )
    ) {
      return;
    }

    let completed = 0;
    pendingTransfers.forEach((transfer) => {
      this.inventoryService.approveStockTransfer(transfer.id).subscribe({
        next: () => {
          completed += 1;
          if (completed === pendingTransfers.length) {
            this.snackBar.open(`${completed} transfer(s) approved`, 'Close', {
              duration: 3000,
            });
            this.selection.clear();
            this.refreshData();
          }
        },
        error: (error) =>
          console.error('Failed approving transfer during bulk action', error),
      });
    });
  }

  toggleAll(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  toggleAllRows(): void {
    this.toggleAll();
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows !== 0;
  }

  viewDetails(transfer: StockTransfer): void {
    console.info('View transfer details', transfer);
  }

  approveTransfer(transferId: string): void {
    if (!confirm('Approve this transfer?')) {
      return;
    }

    this.inventoryService.approveStockTransfer(transferId).subscribe({
      next: () => {
        this.snackBar.open('Transfer approved', 'Close', { duration: 3000 });
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to approve transfer', error);
        this.snackBar.open('Failed to approve transfer', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  shipTransfer(transferId: string): void {
    if (!confirm('Mark this transfer as in transit?')) {
      return;
    }

    this.inventoryService.shipStockTransfer(transferId).subscribe({
      next: () => {
        this.snackBar.open('Transfer shipped', 'Close', { duration: 3000 });
        this.refreshData();
      },
      error: (error) => {
        console.error('Failed to ship transfer', error);
        this.snackBar.open('Failed to update transfer status', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  receiveTransfer(transferId: string): void {
    this.inventoryService.getStockTransferById(transferId).subscribe({
      next: (transfer) => {
        const receivedItems = (transfer.items ?? []).map((item) => ({
          itemId: item.id,
          productId: item.productId,
          receivedQuantity: item.quantity ?? 0,
        }));

        if (!receivedItems.length) {
          this.snackBar.open(
            'No items available to receive for this transfer',
            'Close',
            {
              duration: 3000,
            }
          );
          return;
        }

        this.inventoryService
          .receiveStockTransfer(transferId, receivedItems)
          .subscribe({
            next: () => {
              this.snackBar.open('Transfer received successfully', 'Close', {
                duration: 3000,
              });
              this.refreshData();
            },
            error: (error) => {
              console.error('Failed to receive transfer', error);
              this.snackBar.open('Failed to receive transfer', 'Close', {
                duration: 3000,
              });
            },
          });
      },
      error: (error) => {
        console.error('Failed to load transfer for receiving', error);
        this.snackBar.open('Unable to load transfer details', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  cancelTransfer(transferId: string): void {
    if (!confirm('Cancel this transfer? This cannot be undone.')) {
      return;
    }

    this.inventoryService
      .cancelStockTransfer(transferId, 'Cancelled by user')
      .subscribe({
        next: () => {
          this.snackBar.open('Transfer cancelled', 'Close', { duration: 3000 });
          this.refreshData();
        },
        error: (error) => {
          console.error('Failed to cancel transfer', error);
          this.snackBar.open('Failed to cancel transfer', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  getStatusColor(status: TransferStatus | string): string {
    const map: Record<TransferStatus, string> = {
      draft: '#9ca3af',
      pending: '#f59e0b',
      approved: '#3b82f6',
      in_transit: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#6b7280',
    };
    const normalized = status as TransferStatus;
    return map[normalized] ?? '#6b7280';
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
    });
  }

  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(value);
  }

  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    return new Intl.NumberFormat('en-LK').format(value);
  }

  private formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    return `${new Intl.NumberFormat('en-LK', {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    }).format(value)}%`;
  }

  getStatusLabel(status: string | null | undefined): string {
    if (!status) {
      return 'Unknown';
    }

    return status
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  canApprove(transfer: StockTransfer): boolean {
    return transfer.status === 'pending';
  }

  canShip(transfer: StockTransfer): boolean {
    return transfer.status === 'approved';
  }

  canReceive(transfer: StockTransfer): boolean {
    return transfer.status === 'in_transit';
  }

  private buildTransferFilters(): InventoryFilter {
    const formValue = this.filterForm.value;

    return {
      search: formValue.search || undefined,
      status: formValue.status || undefined,
      locationId:
        formValue.fromLocationId || formValue.toLocationId || undefined,
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
    this.paginator.length = this.totalTransfers;
    this.paginator.pageSize = this.pageSize;
  }

  private refreshData(): void {
    this.loadTransfers();
    this.loadDashboardMetrics();
  }

  private buildMetricCards(
    metrics: StockTransferDashboardMetrics
  ): MetricCard[] {
    const pendingValue = this.getStatusMetric(metrics, 'pending', 'totalValue');
    const inTransitItems = this.getStatusMetric(
      metrics,
      'in_transit',
      'totalItems'
    );
    const completedPercentage = this.getStatusMetric(
      metrics,
      'completed',
      'percentage'
    );
    const completedValue = this.getStatusMetric(
      metrics,
      'completed',
      'totalValue'
    );
    const cancelledValue = this.getStatusMetric(
      metrics,
      'cancelled',
      'totalValue'
    );
    const cancelledItems = this.getStatusMetric(
      metrics,
      'cancelled',
      'totalItems'
    );

    return [
      {
        label: 'Total Transfers',
        value: metrics.totalTransfers,
        icon: 'sync_alt',
        accent: 'primary',
        description: `${this.formatCurrency(metrics.totalValueMoved)} moved`,
      },
      {
        label: 'Pending Approval',
        value: metrics.pendingApproval,
        icon: 'schedule',
        accent: 'accent',
        description: `${this.formatCurrency(pendingValue)} awaiting approval`,
      },
      {
        label: 'In Transit',
        value: metrics.inTransit,
        icon: 'local_shipping',
        accent: 'primary',
        description: `${this.formatNumber(inTransitItems)} items en route`,
      },
      {
        label: 'Completed',
        value: metrics.completed,
        icon: 'check_circle',
        accent: 'primary',
        description: `${this.formatCurrency(
          completedValue
        )} delivered | ${this.formatPercentage(
          completedPercentage
        )} completion`,
      },
      {
        label: 'Cancelled',
        value: metrics.cancelled,
        icon: 'cancel',
        accent: 'warn',
        description: `${this.formatCurrency(
          cancelledValue
        )} value impacted | ${this.formatNumber(cancelledItems)} items`,
      },
    ];
  }

  private getStatusMetric(
    metrics: StockTransferDashboardMetrics,
    targetStatus: TransferStatus | string,
    field: 'count' | 'percentage' | 'totalValue' | 'totalItems'
  ): number {
    const breakdown = metrics.statusBreakdown.find(
      (item) => item.status === targetStatus
    );

    if (!breakdown) {
      return 0;
    }

    switch (field) {
      case 'count':
        return breakdown.count ?? 0;
      case 'percentage':
        return breakdown.percentage ?? 0;
      case 'totalValue':
        return breakdown.totalValue ?? 0;
      case 'totalItems':
        return breakdown.totalItems ?? 0;
      default:
        return 0;
    }
  }

  private normalizeDashboardMetrics(
    metrics?: StockTransferDashboardMetrics | null
  ): StockTransferDashboardMetrics {
    if (!metrics) {
      return this.buildEmptyDashboardMetrics();
    }

    return {
      totalTransfers: metrics.totalTransfers ?? 0,
      pendingApproval: metrics.pendingApproval ?? 0,
      inTransit: metrics.inTransit ?? 0,
      completed: metrics.completed ?? 0,
      cancelled: metrics.cancelled ?? 0,
      totalItemsMoved: metrics.totalItemsMoved ?? 0,
      totalValueMoved: metrics.totalValueMoved ?? 0,
      statusBreakdown: (metrics.statusBreakdown ?? []).map((item) => ({
        status: item.status,
        count: item.count ?? 0,
        percentage: item.percentage ?? 0,
        totalValue: item.totalValue ?? 0,
        totalItems: item.totalItems ?? 0,
      })),
      trend: (metrics.trend ?? []).map((point) => ({
        label: point.label,
        transfers: point.transfers ?? 0,
        totalValue: point.totalValue ?? 0,
        totalItems: point.totalItems ?? 0,
      })),
      topLocations: (metrics.topLocations ?? []).map((location) => ({
        locationId: location.locationId,
        locationName: location.locationName,
        locationCode: location.locationCode,
        outboundTransfers: location.outboundTransfers ?? 0,
        outboundValue: location.outboundValue ?? 0,
        outboundItems: location.outboundItems ?? 0,
      })),
    };
  }

  private buildEmptyDashboardMetrics(): StockTransferDashboardMetrics {
    return {
      totalTransfers: 0,
      pendingApproval: 0,
      inTransit: 0,
      completed: 0,
      cancelled: 0,
      totalItemsMoved: 0,
      totalValueMoved: 0,
      statusBreakdown: [],
      trend: [],
      topLocations: [],
    };
  }
}
