import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  switchMap,
  tap,
  startWith,
  catchError,
} from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { InventoryService } from '../../../services/inventory.service';
import {
  AdjustmentType,
  Location,
  ProductLookupSummary,
  StockAdjustment,
  StockAdjustmentFormData,
} from '../../../models/inventory.model';

export type StockAdjustmentDialogMode = 'create' | 'view';

export interface StockAdjustmentFormDialogData {
  mode: StockAdjustmentDialogMode;
  locations: Location[];
  adjustment?: StockAdjustment;
}

export interface StockAdjustmentFormDialogResult {
  action: 'saved' | 'cancelled' | 'closed' | 'updated';
  adjustment?: StockAdjustment;
}

@Component({
  selector: 'app-stock-adjustment-form-dialog',
  standalone: true,
  templateUrl: './stock-adjustment-form-dialog.component.html',
  styleUrls: ['./stock-adjustment-form-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
})
export class StockAdjustmentFormDialogComponent implements OnInit {
  readonly mode: StockAdjustmentDialogMode;
  readonly locations: Location[];
  readonly adjustment?: StockAdjustment;

  form!: FormGroup;
  productResults$!: Observable<ProductLookupSummary[]>;
  productSearchLoading = false;
  isSubmitting = false;
  selectedProduct: ProductLookupSummary | null = null;
  adjustmentTypes: AdjustmentType[] = [
    'increase',
    'decrease',
    'damage',
    'loss',
    'found',
    'return',
    'correction',
  ];

  constructor(
    private readonly dialogRef: MatDialogRef<
      StockAdjustmentFormDialogComponent,
      StockAdjustmentFormDialogResult
    >,
    @Inject(MAT_DIALOG_DATA)
    private readonly data: StockAdjustmentFormDialogData,
    private readonly fb: FormBuilder,
    private readonly inventoryService: InventoryService,
    private readonly snackBar: MatSnackBar
  ) {
    this.mode = data.mode;
    this.locations = data.locations;
    this.adjustment = data.adjustment;
  }

  ngOnInit(): void {
    this.buildForm();
    this.initializeProductLookup();

    if (this.mode === 'create') {
      this.prefillAdjustmentNumber();
    }

    if (this.adjustment) {
      this.patchForm(this.adjustment);
    }

    if (this.mode === 'view') {
      this.form.disable({ emitEvent: false });
    }
  }

  get title(): string {
    return this.mode === 'create'
      ? 'Create Stock Adjustment'
      : 'Stock Adjustment Details';
  }

  get quantityPreview(): number {
    const quantity = Number(this.form.get('quantity')?.value) || 0;
    const type = this.form.get('adjustmentType')?.value as AdjustmentType;
    if (!quantity) {
      return 0;
    }

    const negativeTypes: AdjustmentType[] = ['decrease', 'damage', 'loss'];
    return negativeTypes.includes(type)
      ? -Math.abs(quantity)
      : Math.abs(quantity);
  }

  submit(): void {
    if (this.mode === 'view') {
      this.dialogRef.close({ action: 'closed' });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.mapFormToPayload();
    this.isSubmitting = true;

    this.inventoryService.createStockAdjustment(payload).subscribe({
      next: (adjustment) => {
        this.isSubmitting = false;
        this.snackBar.open('Stock adjustment created successfully.', 'Close', {
          duration: 3000,
        });
        this.dialogRef.close({ action: 'saved', adjustment });
      },
      error: (error) => {
        console.error('Failed to create stock adjustment:', error);
        this.isSubmitting = false;
        this.snackBar.open(
          'Failed to create stock adjustment. Please try again.',
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

  displayProductOption(option: ProductLookupSummary | string | null): string {
    if (!option) {
      return '';
    }

    if (typeof option === 'string') {
      return option;
    }

    return option.sku ? `${option.name} (${option.sku})` : option.name;
  }

  onProductSelected(event: MatAutocompleteSelectedEvent): void {
    const option = event.option.value as ProductLookupSummary;
    this.selectedProduct = option;
    this.form.patchValue({
      productId: option.id,
      productDisplay: option,
    });
  }

  clearProduct(): void {
    if (this.mode === 'view') {
      return;
    }

    this.selectedProduct = null;
    this.form.patchValue({ productId: null, productDisplay: '' });
  }

  trackByOption(_: number, option: ProductLookupSummary): string {
    return option.id;
  }

  private buildForm(): void {
    this.form = this.fb.group({
      adjustmentNumber: [null, [Validators.maxLength(60)]],
      productId: [null, [Validators.required]],
      productDisplay: ['', [Validators.required]],
      adjustmentType: ['increase', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      reason: ['', [Validators.required, Validators.maxLength(255)]],
      notes: [null, [Validators.maxLength(2000)]],
      locationId: [null],
    });
  }

  private initializeProductLookup(): void {
    const control = this.form.get('productDisplay');
    if (!control) {
      return;
    }

    this.productResults$ = control.valueChanges.pipe(
      startWith(control.value ?? ''),
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => (this.productSearchLoading = true)),
      switchMap((value) => {
        const term = typeof value === 'string' ? value : '';
        return this.inventoryService.searchProducts(term).pipe(
          catchError(() => of([])),
          finalize(() => (this.productSearchLoading = false))
        );
      })
    );
  }

  private prefillAdjustmentNumber(): void {
    this.inventoryService.generateStockAdjustmentNumber().subscribe({
      next: ({ adjustmentNumber }) => {
        if (adjustmentNumber) {
          this.form.patchValue({ adjustmentNumber });
        }
      },
      error: () => {
        this.snackBar.open(
          'Could not generate adjustment number automatically.',
          'Close',
          {
            duration: 3000,
          }
        );
      },
    });
  }

  private patchForm(adjustment: StockAdjustment): void {
    this.selectedProduct = {
      id: adjustment.productId,
      name: adjustment.productName,
      sku: adjustment.productSku,
      stockQuantity: adjustment.previousStock,
      costPrice: adjustment.cost,
    };

    this.form.patchValue({
      adjustmentNumber: adjustment.adjustmentNumber,
      productId: adjustment.productId,
      productDisplay: this.selectedProduct,
      adjustmentType: adjustment.adjustmentType,
      quantity: Math.abs(adjustment.netQuantity ?? adjustment.quantity ?? 0),
      reason: adjustment.reason,
      notes: adjustment.notes ?? null,
      locationId: adjustment.locationId ?? null,
    });
  }

  private mapFormToPayload(): StockAdjustmentFormData {
    const raw = this.form.getRawValue() as {
      adjustmentNumber: string | null;
      productId: string | null;
      adjustmentType: AdjustmentType;
      quantity: number | string;
      reason: string;
      notes: string | null;
      locationId: string | null;
    };

    if (!raw.productId) {
      throw new Error('Product selection is required.');
    }

    return {
      adjustmentNumber: raw.adjustmentNumber ?? undefined,
      productId: raw.productId,
      adjustmentType: raw.adjustmentType,
      quantity: Number(raw.quantity) || 0,
      reason: raw.reason,
      notes: raw.notes ?? undefined,
      locationId: raw.locationId ?? undefined,
    };
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
}
