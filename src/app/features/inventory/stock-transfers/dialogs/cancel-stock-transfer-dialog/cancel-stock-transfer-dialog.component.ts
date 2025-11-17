import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
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
import { StockTransfer } from '../../../models/inventory.model';

export interface CancelStockTransferDialogData {
  transfer: StockTransfer;
}

@Component({
  selector: 'app-cancel-stock-transfer-dialog',
  standalone: true,
  templateUrl: './cancel-stock-transfer-dialog.component.html',
  styleUrls: ['./cancel-stock-transfer-dialog.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class CancelStockTransferDialogComponent {
  form: FormGroup;
  readonly transfer: StockTransfer;

  constructor(
    private readonly dialogRef: MatDialogRef<CancelStockTransferDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: CancelStockTransferDialogData,
    private readonly fb: FormBuilder
  ) {
    this.transfer = data.transfer;
    this.form = this.fb.group({
      reason: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(1000),
        ],
      ],
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const reason = (this.form.value.reason ?? '').trim();
    this.dialogRef.close({ reason });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
