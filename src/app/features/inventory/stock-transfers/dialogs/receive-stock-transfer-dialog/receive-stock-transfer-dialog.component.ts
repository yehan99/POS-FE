import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../../../services/inventory.service';
import {
  StockTransfer,
  StockTransferItem,
} from '../../../models/inventory.model';

export interface ReceiveStockTransferDialogData {
  transfer: StockTransfer;
  requestedBy?: string | null;
}

@Component({
  selector: 'app-receive-stock-transfer-dialog',
  standalone: true,
  templateUrl: './receive-stock-transfer-dialog.component.html',
  styleUrls: ['./receive-stock-transfer-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
})
export class ReceiveStockTransferDialogComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  readonly transfer: StockTransfer;
  readonly defaultReceiver: string | null;

  constructor(
    private readonly dialogRef: MatDialogRef<ReceiveStockTransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: ReceiveStockTransferDialogData,
    private readonly fb: FormBuilder,
    private readonly inventoryService: InventoryService,
    private readonly snackBar: MatSnackBar
  ) {
    this.transfer = data.transfer;
    this.defaultReceiver = data.requestedBy ?? null;
  }

  ngOnInit(): void {
    this.buildForm();
    this.populateItems();
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  get canSubmit(): boolean {
    if (this.pendingItemCount === 0) {
      return false;
    }

    return this.items.controls.some(
      (group) => (Number(group.get('receivedQuantity')?.value) || 0) > 0
    );
  }

  get pendingItemCount(): number {
    return this.items.controls.filter(
      (group) => (group.get('remainingQuantity')?.value ?? 0) > 0
    ).length;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.items.controls.forEach((group) => group.markAllAsTouched());
      this.snackBar.open(
        'Please fix the highlighted fields before submitting.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    const itemsPayload = this.items.controls
      .map((group) => ({
        itemId: group.get('itemId')?.value ?? null,
        productId: group.get('productId')?.value ?? null,
        receivedQuantity: Number(group.get('receivedQuantity')?.value) || 0,
        remainingQuantity: Number(group.get('remainingQuantity')?.value) || 0,
      }))
      .filter((item) => item.receivedQuantity > 0);

    if (itemsPayload.length === 0) {
      this.snackBar.open(
        'Enter a received quantity greater than 0 for at least one item.',
        'Close',
        { duration: 3500 }
      );
      return;
    }

    const payload = {
      receivedItems: itemsPayload.map((item) => ({
        itemId: item.itemId,
        productId: item.productId,
        receivedQuantity: Math.min(
          item.receivedQuantity,
          item.remainingQuantity
        ),
      })),
      receivedBy: this.form.get('receivedBy')?.value ?? undefined,
      notes: this.form.get('notes')?.value ?? undefined,
    };

    this.isSubmitting = true;

    this.inventoryService
      .receiveStockTransfer(this.transfer.id, payload)
      .subscribe({
        next: (updatedTransfer) => {
          this.isSubmitting = false;
          this.snackBar.open('Transfer received successfully.', 'Close', {
            duration: 3500,
          });
          this.dialogRef.close({
            action: 'updated',
            transfer: updatedTransfer,
          });
        },
        error: (error) => {
          console.error('Failed to receive transfer:', error);
          this.isSubmitting = false;
          this.snackBar.open(
            'Failed to record received items. Please try again.',
            'Close',
            { duration: 4000 }
          );
        },
      });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  setFullQuantity(index: number): void {
    const control = this.items.at(index) as FormGroup;
    const remaining = Number(control.get('remainingQuantity')?.value) || 0;
    control.get('receivedQuantity')?.setValue(remaining);
  }

  getOrdered(group: FormGroup): number {
    return Number(group.get('quantity')?.value) || 0;
  }

  getAlreadyReceived(group: FormGroup): number {
    return Number(group.get('alreadyReceived')?.value) || 0;
  }

  getRemaining(group: FormGroup): number {
    return Number(group.get('remainingQuantity')?.value) || 0;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      receivedBy: [this.defaultReceiver ?? null, Validators.maxLength(120)],
      notes: [null, Validators.maxLength(2000)],
      items: this.fb.array([]),
    });
  }

  private populateItems(): void {
    this.items.clear();
    (this.transfer.items ?? []).forEach((item) =>
      this.items.push(this.buildItemGroup(item))
    );
  }

  private buildItemGroup(item: StockTransferItem): FormGroup {
    const ordered = item.quantity ?? 0;
    const alreadyReceived = item.receivedQuantity ?? 0;
    const remaining = Math.max(ordered - alreadyReceived, 0);

    return this.fb.group({
      itemId: [item.id ?? null],
      productId: [item.productId ?? null],
      productName: [{ value: item.productName, disabled: true }],
      productSku: [{ value: item.productSku, disabled: true }],
      quantity: [{ value: ordered, disabled: true }],
      alreadyReceived: [{ value: alreadyReceived, disabled: true }],
      remainingQuantity: [{ value: remaining, disabled: true }],
      receivedQuantity: [
        remaining,
        [Validators.required, Validators.min(0), Validators.max(remaining)],
      ],
    });
  }
}
