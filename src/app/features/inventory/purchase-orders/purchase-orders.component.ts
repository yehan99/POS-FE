import { Component, OnInit, ViewChild } from '@angular/core';
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
} from '../models/inventory.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-purchase-orders',
  standalone: false,
  templateUrl: './purchase-orders.component.html',
  styleUrl: './purchase-orders.component.scss',
})
export class PurchaseOrdersComponent implements OnInit {
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

  dataSource = new MatTableDataSource<PurchaseOrder>([]);
  selection = new SelectionModel<PurchaseOrder>(true, []);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm!: FormGroup;
  isLoading = false;

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
    this.loadSuppliers();
    this.loadPurchaseOrders();
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
        this.totalPOs = response.total;
        this.isLoading = false;
        this.selection.clear();
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
    this.filterForm.reset();
    this.currentPage = 0;
    this.loadPurchaseOrders();
  }

  applyDateFilter(): void {
    this.currentPage = 0;
    this.loadPurchaseOrders();
  }

  createPurchaseOrder(): void {
    // TODO: Navigate to PO creation form
    console.log('Create purchase order');
  }

  viewPODetails(po: PurchaseOrder): void {
    // TODO: Navigate to PO detail page
    console.log('View PO details', po);
  }

  editPO(po: PurchaseOrder): void {
    // TODO: Navigate to PO edit form
    console.log('Edit PO', po);
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
    // TODO: Open receive items dialog
    console.log('Receive PO', po);
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
}
