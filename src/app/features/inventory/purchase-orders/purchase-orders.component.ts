import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { PurchaseOrderService } from '../services/purchase-order.service';
import { SupplierService } from '../services/supplier.service';
import {
  PurchaseOrder,
  PurchaseOrderFilter,
  Supplier,
  POStatus,
  PurchaseOrderDashboardMetrics,
  PurchaseOrderTopSupplier,
  PurchaseOrderTrendPoint,
  PurchaseOrderStatusBreakdown,
} from '../models/inventory.model';
import { debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import { PurchaseOrderFormDialogComponent } from './dialogs/purchase-order-form-dialog/purchase-order-form-dialog.component';
import { ReceivePurchaseOrderDialogComponent } from './dialogs/receive-purchase-order-dialog/receive-purchase-order-dialog.component';

@Component({
  selector: 'app-purchase-orders',
  standalone: false,
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.scss',
})
export class PurchaseOrdersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [
    'select',
    'poNumber',
    'supplier',
    'totalAmount',
    'status',
    'paymentStatus',
    'orderDate',
    'expectedDelivery',
    'actions',
  ];

  topSuppliersDisplayedColumns: string[] = [
    'supplierName',
    'totalValue',
    'totalOrders',
    'onTimeRate',
    'averageLeadTimeDays',
  ];

  dataSource = new MatTableDataSource<PurchaseOrder>([]);
  topSuppliersDataSource = new MatTableDataSource<PurchaseOrderTopSupplier>([]);
  selection = new SelectionModel<PurchaseOrder>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;
  dashboardLoading = false;
  dashboardMetrics?: PurchaseOrderDashboardMetrics;

  totalPOs = 0;
  pageSize = 10;
  currentPage = 0;

  suppliers: Supplier[] = [];
  poStatuses: POStatus[] = [
    'draft',
    'pending',
    'approved',
    'ordered',
    'partially_received',
    'received',
    'cancelled',
  ];

  constructor(
    private poService: PurchaseOrderService,
    private supplierService: SupplierService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeFilterForm();
    this.loadDashboardMetrics();
    this.loadSuppliers();
    this.loadPurchaseOrders();
  }

  ngAfterViewInit(): void {
    this.attachSort();
    this.syncPaginator();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      supplierId: [''],
      status: [''],
      dateFrom: [''],
      dateTo: [''],
    });

    this.filterForm
      .get('search')
      ?.valueChanges.pipe(debounceTime(500), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 0;
        this.loadPurchaseOrders();
      });

    this.filterForm.get('supplierId')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadPurchaseOrders();
    });

    this.filterForm.get('status')?.valueChanges.subscribe(() => {
      this.currentPage = 0;
      this.loadPurchaseOrders();
    });
  }

  loadDashboardMetrics(): void {
    this.dashboardLoading = true;
    this.poService.getPurchaseOrderDashboardMetrics().subscribe({
      next: (metrics) => {
        this.dashboardMetrics = this.normalizeDashboardMetrics(metrics);
        this.topSuppliersDataSource.data = this.dashboardMetrics.topSuppliers;
        this.dashboardLoading = false;
      },
      error: (error) => {
        console.error('Error loading purchase order dashboard metrics:', error);
        const fallback = this.buildMockDashboardMetrics();
        this.dashboardMetrics = fallback;
        this.topSuppliersDataSource.data = fallback.topSuppliers;
        this.dashboardLoading = false;
      },
    });
  }

  loadSuppliers(): void {
    this.supplierService.getActiveSuppliers().subscribe({
      next: (suppliers) => {
        this.suppliers = suppliers;
      },
      error: (error) => {
        console.error('Error loading suppliers:', error);
      },
    });
  }

  loadPurchaseOrders(): void {
    this.isLoading = true;
    const formValue = this.filterForm.value;

    const filters: PurchaseOrderFilter = {
      search: formValue.search || undefined,
      supplierId: formValue.supplierId || undefined,
      status: formValue.status || undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined,
      page: this.currentPage + 1,
      pageSize: this.pageSize,
    };

    this.poService.getPurchaseOrders(filters).subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        const pagination = response.pagination;

        this.totalPOs = pagination.total;
        this.pageSize = pagination.limit;
        this.currentPage = Math.max(pagination.page - 1, 0);
        this.isLoading = false;
        this.selection.clear();
        this.syncPaginator();
        this.attachSort();
      },
      error: (error) => {
        console.error('Error loading purchase orders:', error);
        this.snackBar.open('Failed to load purchase orders', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadPurchaseOrders();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      supplierId: '',
      status: '',
      dateFrom: null,
      dateTo: null,
    });
    this.currentPage = 0;
    this.loadPurchaseOrders();
  }

  applyDateFilter(): void {
    this.currentPage = 0;
    this.loadPurchaseOrders();
  }

  createPurchaseOrder(): void {
    const dialogRef = this.dialog.open(PurchaseOrderFormDialogComponent, {
      width: '920px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'purchase-order-dialog-panel',
      data: {
        mode: 'create',
        suppliers: this.suppliers,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'saved') {
        this.loadPurchaseOrders();
        this.loadDashboardMetrics();
      }
    });
  }

  viewPODetails(po: PurchaseOrder): void {
    this.dialog.open(PurchaseOrderFormDialogComponent, {
      width: '920px',
      autoFocus: false,
      panelClass: 'purchase-order-dialog-panel',
      data: {
        mode: 'view',
        purchaseOrder: po,
        suppliers: this.suppliers,
      },
    });
  }

  editPO(po: PurchaseOrder): void {
    const dialogRef = this.dialog.open(PurchaseOrderFormDialogComponent, {
      width: '920px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'purchase-order-dialog-panel',
      data: {
        mode: 'edit',
        purchaseOrder: po,
        suppliers: this.suppliers,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'saved') {
        this.loadPurchaseOrders();
        this.loadDashboardMetrics();
      }
    });
  }

  approvePO(po: PurchaseOrder): void {
    if (confirm(`Are you sure you want to approve PO "${po.poNumber}"?`)) {
      this.poService.approvePurchaseOrder(po.id).subscribe({
        next: () => {
          this.snackBar.open('Purchase order approved successfully', 'Close', {
            duration: 3000,
          });
          this.loadPurchaseOrders();
        },
        error: (error) => {
          console.error('Error approving PO:', error);
          this.snackBar.open('Failed to approve purchase order', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  sendPO(po: PurchaseOrder): void {
    const supplier = this.suppliers.find((s) => s.id === po.supplierId);
    if (!supplier?.email) {
      this.snackBar.open('Supplier email not found', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (confirm(`Send PO "${po.poNumber}" to ${supplier.email}?`)) {
      this.poService.sendPurchaseOrder(po.id, supplier.email).subscribe({
        next: () => {
          this.snackBar.open('Purchase order sent successfully', 'Close', {
            duration: 3000,
          });
          this.loadPurchaseOrders();
        },
        error: (error) => {
          console.error('Error sending PO:', error);
          this.snackBar.open('Failed to send purchase order', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  receivePO(po: PurchaseOrder): void {
    const dialogRef = this.dialog.open(ReceivePurchaseOrderDialogComponent, {
      width: '640px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'purchase-order-dialog-panel',
      data: {
        purchaseOrder: po,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result?.action === 'updated') {
        this.loadPurchaseOrders();
        this.loadDashboardMetrics();
      }
    });
  }

  cancelPO(po: PurchaseOrder): void {
    if (confirm(`Are you sure you want to cancel PO "${po.poNumber}"?`)) {
      this.poService.cancelPurchaseOrder(po.id, 'Cancelled by user').subscribe({
        next: () => {
          this.snackBar.open('Purchase order cancelled', 'Close', {
            duration: 3000,
          });
          this.loadPurchaseOrders();
        },
        error: (error) => {
          console.error('Error cancelling PO:', error);
          this.snackBar.open('Failed to cancel purchase order', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  bulkCancelSelected(): void {
    if (this.selection.selected.length === 0) {
      return;
    }

    const cancellable = this.selection.selected.filter((po) =>
      this.canCancel(po)
    );

    if (cancellable.length === 0) {
      this.snackBar.open(
        'Selected purchase orders cannot be cancelled.',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    if (
      !confirm(
        `Cancel ${cancellable.length} selected purchase order(s)? This cannot be undone.`
      )
    ) {
      return;
    }

    const requests = cancellable.map((po) =>
      this.poService.cancelPurchaseOrder(po.id, 'Cancelled in bulk')
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.snackBar.open('Selected purchase orders cancelled.', 'Close', {
          duration: 3000,
        });
        this.loadPurchaseOrders();
        this.selection.clear();
      },
      error: (error) => {
        console.error('Error cancelling selected purchase orders:', error);
        this.snackBar.open(
          'Failed to cancel selected purchase orders.',
          'Close',
          {
            duration: 3000,
          }
        );
        this.loadPurchaseOrders();
      },
    });
  }

  downloadPDF(po: PurchaseOrder): void {
    this.poService.generatePDF(po.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `PO_${po.poNumber}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('PDF downloaded successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        this.snackBar.open('Failed to download PDF', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  exportPOs(): void {
    const formValue = this.filterForm.value;

    const filters: PurchaseOrderFilter = {
      search: formValue.search || undefined,
      supplierId: formValue.supplierId || undefined,
      status: formValue.status || undefined,
      dateFrom: formValue.dateFrom || undefined,
      dateTo: formValue.dateTo || undefined,
    };

    this.poService.exportPurchaseOrders(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `purchase_orders_${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.snackBar.open('Purchase orders exported successfully', 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        console.error('Error exporting POs:', error);
        this.snackBar.open('Failed to export purchase orders', 'Close', {
          duration: 3000,
        });
      },
    });
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
  getStatusColor(status: POStatus): string {
    switch (status) {
      case 'draft':
        return '#9ca3af';
      case 'pending':
        return '#f59e0b';
      case 'approved':
        return '#3b82f6';
      case 'ordered':
        return '#8b5cf6';
      case 'partially_received':
        return '#f97316';
      case 'received':
        return '#10b981';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'partial':
        return '#f59e0b';
      case 'unpaid':
        return '#6b7280';
      case 'overdue':
        return '#ef4444';
      default:
        return '#9ca3af';
    }
  }

  formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) {
      return '—';
    }

    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) {
      return '—';
    }

    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return '—';
    }

    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    return `${Number(value).toFixed(1)}%`;
  }

  formatCycleTime(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (value < 1) {
      return '<1 day';
    }

    return `${Number(value).toFixed(1)} days`;
  }

  formatLeadTime(value: number | null | undefined): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (value < 1) {
      return '<1 day';
    }

    return `${Number(value).toFixed(1)} days`;
  }

  formatStatusLabel(status: string | null | undefined): string {
    if (!status) {
      return 'Unknown';
    }

    return status
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private normalizeDashboardMetrics(
    metrics: PurchaseOrderDashboardMetrics | null | undefined
  ): PurchaseOrderDashboardMetrics {
    if (!metrics) {
      return this.buildMockDashboardMetrics();
    }

    const statusBreakdown: PurchaseOrderStatusBreakdown[] = (
      metrics.statusBreakdown ?? []
    ).map((item) => ({
      status: item.status,
      count: item.count ?? 0,
      percentage: item.percentage ?? 0,
      totalValue: item.totalValue ?? 0,
    }));

    const trend: PurchaseOrderTrendPoint[] = (metrics.trend ?? []).map(
      (point) => ({
        label: point.label,
        totalValue: point.totalValue ?? 0,
        purchaseOrders: point.purchaseOrders ?? 0,
      })
    );

    const topSuppliers: PurchaseOrderTopSupplier[] = (
      metrics.topSuppliers ?? []
    ).map((supplier) => ({
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      totalOrders: supplier.totalOrders ?? 0,
      totalValue: supplier.totalValue ?? 0,
      onTimeRate: supplier.onTimeRate ?? null,
      averageLeadTimeDays: supplier.averageLeadTimeDays ?? null,
    }));

    return {
      totalPurchaseOrders: metrics.totalPurchaseOrders ?? 0,
      pendingApproval: metrics.pendingApproval ?? 0,
      inProgress: metrics.inProgress ?? 0,
      partiallyReceived: metrics.partiallyReceived ?? 0,
      received: metrics.received ?? 0,
      cancelled: metrics.cancelled ?? 0,
      overdue: metrics.overdue ?? 0,
      totalValue: metrics.totalValue ?? 0,
      outstandingValue: metrics.outstandingValue ?? 0,
      spendThisMonth: metrics.spendThisMonth ?? 0,
      spendLastMonth: metrics.spendLastMonth ?? 0,
      averageCycleTimeDays: metrics.averageCycleTimeDays ?? 0,
      onTimeFulfillmentRate: metrics.onTimeFulfillmentRate ?? 0,
      statusBreakdown,
      trend,
      topSuppliers,
    };
  }

  private buildMockDashboardMetrics(): PurchaseOrderDashboardMetrics {
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
      statusBreakdown: [
        { status: 'pending', count: 18, percentage: 18, totalValue: 2400000 },
        { status: 'approved', count: 24, percentage: 24, totalValue: 3150000 },
        { status: 'ordered', count: 22, percentage: 22, totalValue: 2865000 },
        {
          status: 'partially_received',
          count: 12,
          percentage: 12,
          totalValue: 1420000,
        },
        { status: 'received', count: 24, percentage: 24, totalValue: 3650000 },
      ],
      trend: [
        { label: 'May', totalValue: 1850000, purchaseOrders: 26 },
        { label: 'Jun', totalValue: 2045000, purchaseOrders: 29 },
        { label: 'Jul', totalValue: 2120000, purchaseOrders: 31 },
        { label: 'Aug', totalValue: 2365000, purchaseOrders: 34 },
      ],
      topSuppliers: [
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
      ],
    };
  }

  canApprove(po: PurchaseOrder): boolean {
    return po.status === 'pending';
  }

  canSend(po: PurchaseOrder): boolean {
    return po.status === 'approved' || po.status === 'ordered';
  }

  canReceive(po: PurchaseOrder): boolean {
    return po.status === 'ordered' || po.status === 'partially_received';
  }

  canCancel(po: PurchaseOrder): boolean {
    return po.status !== 'received' && po.status !== 'cancelled';
  }

  getStatusColorValue(status: string | null | undefined): string {
    if (!status) {
      return '#6b7280';
    }

    if (this.poStatuses.includes(status as POStatus)) {
      return this.getStatusColor(status as POStatus);
    }

    return '#6b7280';
  }

  private syncPaginator(): void {
    if (!this.paginator) {
      return;
    }

    this.paginator.pageIndex = this.currentPage;
    this.paginator.length = this.totalPOs;
    this.paginator.pageSize = this.pageSize;
  }

  private attachSort(): void {
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }
}
