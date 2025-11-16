import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PurchaseOrder } from '../../../models/inventory.model';
import { PurchaseOrderService } from '../../../services/purchase-order.service';

export interface ReceivePurchaseOrderDialogData {
  purchaseOrder: PurchaseOrder;
}

@Component({
  selector: 'app-receive-purchase-order-dialog',
  standalone: false,
  templateUrl: './receive-purchase-order-dialog.component.html',
  styleUrls: ['./receive-purchase-order-dialog.component.scss'],
})
export class ReceivePurchaseOrderDialogComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  purchaseOrder: PurchaseOrder;

  constructor(
    private readonly dialogRef: MatDialogRef<ReceivePurchaseOrderDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: ReceivePurchaseOrderDialogData,
    private readonly fb: FormBuilder,
    private readonly purchaseOrderService: PurchaseOrderService,
    private readonly snackBar: MatSnackBar
  ) {
    this.purchaseOrder = data.purchaseOrder;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      items: this.fb.array(
        this.purchaseOrder.items.map((item) =>
          this.fb.group({
            id: [item.id, Validators.required],
            productName: [{ value: item.productName, disabled: true }],
            orderedQuantity: [{ value: item.quantity, disabled: true }],
            receivedQuantity: [
              item.receivedQuantity ?? 0,
              [
                Validators.required,
                Validators.min(0),
                Validators.max(item.quantity),
              ],
            ],
          })
        )
      ),
    });
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  trackByIndex(index: number): number {
    return index;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(
        'Please review received quantities before confirming.',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    const payload = this.items.controls.map((group) => ({
      id: group.get('id')?.value,
      receivedQuantity: Number(group.get('receivedQuantity')?.value) || 0,
    }));

    this.isSubmitting = true;
    this.purchaseOrderService
      .receivePurchaseOrder(this.purchaseOrder.id, payload)
      .subscribe({
        next: (order) => {
          this.isSubmitting = false;
          this.snackBar.open(
            'Purchase order receipt updated successfully.',
            'Close',
            {
              duration: 3500,
            }
          );
          this.dialogRef.close({ action: 'updated', purchaseOrder: order });
        },
        error: (error) => {
          console.error('Failed to update received quantities:', error);
          this.isSubmitting = false;
          this.snackBar.open(
            'Failed to update receipt. Please try again.',
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
}
