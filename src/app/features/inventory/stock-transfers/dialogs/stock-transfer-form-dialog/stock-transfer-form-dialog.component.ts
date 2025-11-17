import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryService } from '../../../services/inventory.service';
import {
  Location,
  StockTransfer,
  StockTransferFormData,
  StockTransferItem,
} from '../../../models/inventory.model';

import { ReactiveFormsModule } from '@angular/forms';

export type StockTransferDialogMode = 'create' | 'view';

export interface StockTransferFormDialogData {
  mode: StockTransferDialogMode;
  locations: Location[];
  transfer?: StockTransfer;
  requestedBy?: string | null;
}

@Component({
  selector: 'app-stock-transfer-form-dialog',
  standalone: true,
  templateUrl: './stock-transfer-form-dialog.component.html',
  styleUrls: ['./stock-transfer-form-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class StockTransferFormDialogComponent implements OnInit {
  form!: FormGroup;
  isSubmitting = false;
  readonly mode: StockTransferDialogMode;
  readonly locations: Location[];
  readonly requestedByFallback: string | null;
  readonly transfer?: StockTransfer;

  constructor(
    private readonly dialogRef: MatDialogRef<StockTransferFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: StockTransferFormDialogData,
    private readonly fb: FormBuilder,
    private readonly inventoryService: InventoryService,
    private readonly snackBar: MatSnackBar
  ) {
    this.mode = data.mode;
    this.locations = data.locations;
    this.requestedByFallback = data.requestedBy ?? null;
    this.transfer = data.transfer;
  }

  ngOnInit(): void {
    this.buildForm();

    if (this.requestedByFallback && !this.transfer) {
      this.form.patchValue({ requestedBy: this.requestedByFallback });
    }

    if (this.transfer) {
      this.patchForm(this.transfer);
    }

    if (this.mode === 'view') {
      this.form.disable({ emitEvent: false });
    }

    if (this.items.length === 0) {
      this.addItem();
    }
  }

  get title(): string {
    if (this.mode === 'create') {
      return 'Create Stock Transfer';
    }

    if (this.mode === 'view') {
      return 'Stock Transfer Details';
    }

    return 'Stock Transfer';
  }

  get items(): FormArray<FormGroup> {
    return this.form.get('items') as FormArray<FormGroup>;
  }

  get formTotals(): { totalItems: number; totalValue: number } {
    const raw = this.items.getRawValue() as Array<{
      quantity: number | string | null;
      unitCost: number | string | null;
    }>;

    const totalItems = raw.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0
    );
    const totalValue = raw.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
      0
    );

    return {
      totalItems,
      totalValue,
    };
  }

  addItem(item?: Partial<StockTransferItem>): void {
    if (this.mode === 'view') {
      return;
    }

    this.items.push(
      this.fb.group({
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
        unitCost: [item?.unitCost ?? 0, [Validators.min(0)]],
      })
    );
  }

  removeItem(index: number): void {
    if (this.mode === 'view') {
      return;
    }

    if (this.items.length === 1) {
      this.snackBar.open(
        'A transfer must include at least one line item.',
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
      this.items.controls.forEach((group) => group.markAllAsTouched());
      if (this.form.errors?.['sameLocation']) {
        this.snackBar.open(
          'From and to locations must be different before submitting.',
          'Close',
          { duration: 3000 }
        );
      } else {
        this.snackBar.open(
          'Please complete all required fields before saving.',
          'Close',
          { duration: 3000 }
        );
      }
      return;
    }

    const payload = this.mapFormToPayload();
    this.isSubmitting = true;

    this.inventoryService.createStockTransfer(payload).subscribe({
      next: (transfer) => {
        this.isSubmitting = false;
        this.snackBar.open('Stock transfer created successfully.', 'Close', {
          duration: 3500,
        });
        this.dialogRef.close({ action: 'saved', transfer });
      },
      error: (error) => {
        console.error('Failed to create stock transfer:', error);
        this.isSubmitting = false;
        this.snackBar.open(
          'Failed to create stock transfer. Please try again.',
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

  trackByIndex(index: number): number {
    return index;
  }

  getLineTotal(group: FormGroup): number {
    const quantity = Number(group.get('quantity')?.value) || 0;
    const unitCost = Number(group.get('unitCost')?.value) || 0;
    return Math.max(quantity * unitCost, 0);
  }

  private buildForm(): void {
    this.form = this.fb.group(
      {
        fromLocationId: [null, Validators.required],
        toLocationId: [null, Validators.required],
        requestedBy: [
          this.requestedByFallback ?? null,
          Validators.maxLength(120),
        ],
        notes: [null, Validators.maxLength(2000)],
        items: this.fb.array([]),
      },
      { validators: this.validateLocations }
    );
  }

  private patchForm(transfer: StockTransfer): void {
    this.form.patchValue({
      fromLocationId: transfer.fromLocationId,
      toLocationId: transfer.toLocationId,
      requestedBy: transfer.requestedBy,
      notes: transfer.notes,
    });

    this.items.clear();
    (transfer.items ?? []).forEach((item) =>
      this.items.push(
        this.fb.group({
          productId: [item.productId ?? null],
          productName: [item.productName, [Validators.required]],
          productSku: [item.productSku ?? null],
          quantity: [item.quantity, [Validators.required, Validators.min(1)]],
          unitCost: [item.unitCost ?? 0, [Validators.min(0)]],
        })
      )
    );
  }

  private mapFormToPayload(): StockTransferFormData {
    const raw = this.form.getRawValue() as {
      fromLocationId: string | null;
      toLocationId: string | null;
      requestedBy: string | null;
      notes: string | null;
      items: Array<{
        productId: string | null;
        productName: string;
        productSku: string | null;
        quantity: number | string | null;
        unitCost: number | string | null;
      }>;
    };

    if (!raw.fromLocationId || !raw.toLocationId) {
      throw new Error('Location selections are required.');
    }

    const items: StockTransferItem[] = raw.items.map((item) => ({
      productId: item.productId ?? null,
      productName: item.productName,
      productSku: item.productSku ?? null,
      quantity: Number(item.quantity) || 0,
      unitCost: Number(item.unitCost) || 0,
      totalCost: (Number(item.quantity) || 0) * (Number(item.unitCost) || 0),
    }));

    return {
      fromLocationId: raw.fromLocationId,
      toLocationId: raw.toLocationId,
      requestedBy: raw.requestedBy ?? undefined,
      notes: raw.notes ?? undefined,
      items,
    };
  }

  private validateLocations = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const from = control.get('fromLocationId')?.value;
    const to = control.get('toLocationId')?.value;

    if (from && to && from === to) {
      return { sameLocation: true };
    }

    return null;
  };
}
