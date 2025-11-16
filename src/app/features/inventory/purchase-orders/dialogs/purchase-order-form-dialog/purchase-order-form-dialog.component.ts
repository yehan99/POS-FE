import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import {
  PurchaseOrder,
  PurchaseOrderFormData,
  PurchaseOrderItem,
  Supplier,
  POStatus,
  PaymentStatus,
} from '../../../models/inventory.model';
import { PurchaseOrderService } from '../../../services/purchase-order.service';

type PurchaseOrderDialogMode = 'create' | 'edit' | 'view';

type PurchaseOrderItemFormValue = {
  id: string | null;
  productId: string | null;
  productName: string;
  productSku: string | null;
  quantity: number | string | null;
  receivedQuantity: number | string | null;
  unitCost: number | string | null;
  tax: number | string | null;
  discount: number | string | null;
};

type PurchaseOrderFormValue = {
  supplierId: string | null;
  status: POStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  expectedDeliveryDate: Date | string | null;
  actualDeliveryDate: Date | string | null;
  discount: number | string | null;
  shippingCost: number | string | null;
  notes: string | null;
  termsAndConditions: string | null;
  items: PurchaseOrderItemFormValue[];
};

export interface PurchaseOrderFormDialogData {
  mode: PurchaseOrderDialogMode;
  purchaseOrder?: PurchaseOrder;
  suppliers: Supplier[];
}

@Component({
  selector: 'app-purchase-order-form-dialog',
  standalone: false,
  templateUrl: './purchase-order-form-dialog.component.html',
  styleUrls: ['./purchase-order-form-dialog.component.scss'],
})
export class PurchaseOrderFormDialogComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  mode: PurchaseOrderDialogMode;
  suppliers: Supplier[];

  poStatuses: POStatus[] = [
    'draft',
    'pending',
    'approved',
    'ordered',
    'partially_received',
    'received',
    'cancelled',
  ];

  paymentStatuses: PaymentStatus[] = ['unpaid', 'partial', 'paid', 'overdue'];

  constructor(
    private readonly dialogRef: MatDialogRef<PurchaseOrderFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly data: PurchaseOrderFormDialogData,
    private readonly fb: FormBuilder,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly snackBar: MatSnackBar
  ) {
    this.mode = data.mode;
    this.suppliers = data.suppliers;
  }

  ngOnInit(): void {
    this.buildForm();
    if (this.data.purchaseOrder) {
      this.patchForm(this.data.purchaseOrder);
    }

    if (this.mode === 'view') {
      this.form.disable({ emitEvent: false });
    }

    if (this.items.length === 0) {
      this.addItem();
    }
  }

  get title(): string {
    switch (this.mode) {
      case 'create':
        return 'Create Purchase Order';
      case 'edit':
        return 'Edit Purchase Order';
      case 'view':
      default:
        return 'Purchase Order Details';
    }
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  addItem(item?: Partial<PurchaseOrderItem>): void {
    this.items.push(
      this.fb.group({
        id: [item?.id ?? null],
        productId: [item?.productId ?? null],
        productName: [
          item?.productName ?? '',
          [Validators.required, Validators.maxLength(200)],
        ],
        productSku: [item?.productSku ?? null, Validators.maxLength(120)],
        quantity: [
          item?.quantity ?? 1,
          [Validators.required, Validators.min(1)],
        ],
        receivedQuantity: [item?.receivedQuantity ?? 0, [Validators.min(0)]],
        unitCost: [
          item?.unitCost ?? 0,
          [Validators.required, Validators.min(0)],
        ],
        tax: [item?.tax ?? 0, [Validators.min(0)]],
        discount: [item?.discount ?? 0, [Validators.min(0)]],
      })
    );
  }

  removeItem(index: number): void {
    if (this.mode === 'view') {
      return;
    }

    if (this.items.length === 1) {
      this.snackBar.open(
        'A purchase order must have at least one item.',
        'Close',
        {
          duration: 2500,
        }
      );
      return;
    }

    this.items.removeAt(index);
  }

  submit(): void {
    if (this.mode === 'view') {
      this.dialogRef.close();
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(
        'Please complete all required fields before saving.',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    const payload = this.mapFormToPayload();
    this.isSubmitting = true;

    let request$: Observable<PurchaseOrder>;
    if (this.mode === 'create') {
      request$ = this.purchaseOrderService.createPurchaseOrder(payload);
    } else if (this.mode === 'edit' && this.data.purchaseOrder) {
      request$ = this.purchaseOrderService.updatePurchaseOrder(
        this.data.purchaseOrder.id,
        payload
      );
    } else {
      this.isSubmitting = false;
      return;
    }

    request$.subscribe({
      next: (order) => {
        this.isSubmitting = false;
        this.snackBar.open(
          this.mode === 'create'
            ? 'Purchase order created successfully.'
            : 'Purchase order updated successfully.',
          'Close',
          { duration: 3500 }
        );
        this.dialogRef.close({ action: 'saved', purchaseOrder: order });
      },
      error: (error) => {
        console.error('Failed to save purchase order:', error);
        this.isSubmitting = false;
        this.snackBar.open(
          'Failed to save purchase order. Please try again.',
          'Close',
          {
            duration: 3500,
          }
        );
      },
    });
  }

  cancel(): void {
    this.dialogRef.close({ action: 'cancelled' });
  }

  get formTotals(): {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  } {
    const raw = this.items.getRawValue() as PurchaseOrderItemFormValue[];
    const subtotal = raw.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
      0
    );
    const tax = raw.reduce((sum, item) => sum + (Number(item.tax) || 0), 0);
    const lineDiscounts = raw.reduce(
      (sum, item) => sum + (Number(item.discount) || 0),
      0
    );

    const orderDiscount = Number(this.form.get('discount')?.value) || 0;
    const shipping = Number(this.form.get('shippingCost')?.value) || 0;

    const totalDiscount = lineDiscounts + orderDiscount;
    const total = Math.max(subtotal + tax - totalDiscount + shipping, 0);

    return {
      subtotal,
      tax,
      discount: totalDiscount,
      total,
    };
  }

  trackByIndex(index: number): number {
    return index;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      supplierId: [
        this.data.purchaseOrder?.supplierId ?? null,
        Validators.required,
      ],
      status: [
        this.data.purchaseOrder?.status ?? 'pending',
        Validators.required,
      ],
      paymentStatus: [
        this.data.purchaseOrder?.paymentStatus ?? 'unpaid',
        Validators.required,
      ],
      paymentMethod: [
        this.data.purchaseOrder?.paymentMethod ?? null,
        Validators.maxLength(80),
      ],
      expectedDeliveryDate: [
        this.toDateValue(this.data.purchaseOrder?.expectedDeliveryDate),
      ],
      actualDeliveryDate: [
        this.toDateValue(this.data.purchaseOrder?.actualDeliveryDate),
      ],
      discount: [this.data.purchaseOrder?.discount ?? 0, [Validators.min(0)]],
      shippingCost: [
        this.data.purchaseOrder?.shippingCost ?? 0,
        [Validators.min(0)],
      ],
      notes: [
        this.data.purchaseOrder?.notes ?? null,
        Validators.maxLength(2000),
      ],
      termsAndConditions: [this.data.purchaseOrder?.termsAndConditions ?? null],
      items: this.fb.array([]),
    });
  }

  private patchForm(order: PurchaseOrder): void {
    if (!order.items || order.items.length === 0) {
      return;
    }

    order.items.forEach((item) => this.addItem(item));
  }

  private mapFormToPayload(): PurchaseOrderFormData {
    const raw = this.form.getRawValue() as PurchaseOrderFormValue;

    if (!raw.supplierId) {
      throw new Error('Supplier selection is required to submit the form.');
    }

    const items: PurchaseOrderItem[] = raw.items.map((item) => ({
      id: item.id ?? undefined,
      productId: item.productId ?? null,
      productName: item.productName,
      productSku: item.productSku ?? null,
      quantity: Number(item.quantity) || 0,
      receivedQuantity: Number(item.receivedQuantity) || 0,
      unitCost: Number(item.unitCost) || 0,
      tax: Number(item.tax) || 0,
      discount: Number(item.discount) || 0,
      total: Math.max(
        (Number(item.quantity) || 0) * (Number(item.unitCost) || 0) +
          (Number(item.tax) || 0) -
          (Number(item.discount) || 0),
        0
      ),
    }));

    const expectedDeliveryDate =
      this.toDateValue(raw.expectedDeliveryDate) ?? undefined;
    const actualDeliveryDate =
      this.toDateValue(raw.actualDeliveryDate) ?? undefined;

    return {
      supplierId: raw.supplierId,
      status: raw.status,
      paymentStatus: raw.paymentStatus,
      paymentMethod: raw.paymentMethod ?? undefined,
      expectedDeliveryDate,
      actualDeliveryDate,
      discount: Number(raw.discount) || 0,
      shippingCost: Number(raw.shippingCost) || 0,
      notes: raw.notes ?? undefined,
      termsAndConditions: raw.termsAndConditions ?? undefined,
      items,
    };
  }

  private toDateValue(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
