import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { StockAdjustment } from '../../../models/inventory.model';

export interface RejectStockAdjustmentDialogData {
  adjustment: StockAdjustment;
}

export interface RejectStockAdjustmentDialogResult {
  action: 'rejected' | 'cancelled';
  reason?: string;
}

@Component({
  selector: 'app-reject-stock-adjustment-dialog',
  standalone: true,
  templateUrl: './reject-stock-adjustment-dialog.component.html',
  styleUrls: ['./reject-stock-adjustment-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class RejectStockAdjustmentDialogComponent {
  form: FormGroup;

  constructor(
    private readonly dialogRef: MatDialogRef<
      RejectStockAdjustmentDialogComponent,
      RejectStockAdjustmentDialogResult
    >,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: RejectStockAdjustmentDialogData,
    private readonly fb: FormBuilder
  ) {
    this.form = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reason = this.form.value.reason as string;
    this.dialogRef.close({ action: 'rejected', reason });
  }

  cancel(): void {
    this.dialogRef.close({ action: 'cancelled' });
  }
}
