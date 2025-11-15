import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { Supplier, SupplierFormData } from '../../../models/inventory.model';
import { SupplierService } from '../../../services/supplier.service';

export interface SupplierFormDialogData {
  supplier?: Supplier;
}

interface DialogClosePayload {
  action: 'created' | 'updated' | 'cancelled';
  supplier?: Supplier;
}

@Component({
  selector: 'app-supplier-form-dialog',
  standalone: false,
  templateUrl: './supplier-form-dialog.component.html',
  styleUrls: ['./supplier-form-dialog.component.scss'],
})
export class SupplierFormDialogComponent implements OnInit {
  form!: FormGroup;
  mode: 'create' | 'edit' = 'create';
  isSaving = false;
  supplierCode?: string | null;

  readonly statuses = ['active', 'inactive', 'blocked'];
  readonly categories = [
    'Electronics',
    'Food & Beverages',
    'Clothing',
    'Furniture',
    'Stationery',
    'Hardware',
    'Cosmetics',
    'Packaging',
    'Cleaning & Hygiene',
    'Logistics',
    'Office Supplies',
    'Other',
  ];

  readonly paymentTermsOptions = ['Net 15', 'Net 30', 'Net 45', 'Net 60'];

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private dialogRef: MatDialogRef<
      SupplierFormDialogComponent,
      DialogClosePayload
    >,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: SupplierFormDialogData
  ) {}

  ngOnInit(): void {
    this.mode = this.data?.supplier ? 'edit' : 'create';
    this.buildForm();

    if (this.mode === 'edit' && this.data.supplier) {
      this.populateForm(this.data.supplier);
      this.supplierCode = this.data.supplier.supplierCode;
    } else {
      this.generateSupplierCode();
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      contactPerson: ['', [Validators.maxLength(150)]],
      email: ['', [Validators.email, Validators.maxLength(150)]],
      phone: ['', [Validators.maxLength(60)]],
      category: [''],
      status: ['active'],
      isActive: [true],
      isPreferred: [false],
      paymentTerms: ['Net 30', [Validators.maxLength(255)]],
      creditLimit: [null, [Validators.min(0)]],
      taxId: ['', [Validators.maxLength(120)]],
      website: ['', [Validators.maxLength(255)]],
      street: ['', [Validators.maxLength(255)]],
      city: ['', [Validators.maxLength(120)]],
      state: ['', [Validators.maxLength(120)]],
      postalCode: ['', [Validators.maxLength(20)]],
      country: ['Sri Lanka', [Validators.maxLength(120)]],
      bankName: ['', [Validators.maxLength(150)]],
      accountNumber: ['', [Validators.maxLength(120)]],
      accountName: ['', [Validators.maxLength(150)]],
      branchCode: ['', [Validators.maxLength(60)]],
      swiftCode: ['', [Validators.maxLength(60)]],
      notes: ['', [Validators.maxLength(500)]],
      rating: [null, [Validators.min(0), Validators.max(5)]],
      onTimeDeliveryRate: [null, [Validators.min(0), Validators.max(100)]],
      averageLeadTimeDays: [null, [Validators.min(0)]],
    });
  }

  populateForm(supplier: Supplier): void {
    this.form.patchValue({
      name: supplier.name,
      contactPerson: supplier.contactPerson ?? '',
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      category: supplier.category ?? '',
      status: supplier.status ?? (supplier.isActive ? 'active' : 'inactive'),
      isActive: supplier.isActive,
      isPreferred: supplier.isPreferred ?? false,
      paymentTerms: supplier.paymentTerms ?? 'Net 30',
      creditLimit: supplier.creditLimit ?? null,
      taxId: supplier.taxId ?? '',
      website: supplier.website ?? '',
      street: supplier.address?.street ?? '',
      city: supplier.address?.city ?? '',
      state: supplier.address?.state ?? '',
      postalCode: supplier.address?.postalCode ?? '',
      country: supplier.address?.country ?? 'Sri Lanka',
      bankName: supplier.bankDetails?.bankName ?? '',
      accountNumber: supplier.bankDetails?.accountNumber ?? '',
      accountName: supplier.bankDetails?.accountName ?? '',
      branchCode: supplier.bankDetails?.branchCode ?? '',
      swiftCode: supplier.bankDetails?.swiftCode ?? '',
      notes: supplier.notes ?? '',
      rating: supplier.rating ?? null,
      onTimeDeliveryRate: supplier.onTimeDeliveryRate ?? null,
      averageLeadTimeDays: supplier.averageLeadTimeDays ?? null,
    });
  }

  private generateSupplierCode(): void {
    this.supplierService.generateSupplierCode().subscribe({
      next: (code: string) => {
        this.supplierCode = code;
      },
      error: () => {
        this.supplierCode = null;
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Please review the highlighted fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const payload = this.buildPayload();

    this.isSaving = true;
    const request$ =
      this.mode === 'edit' && this.data.supplier
        ? this.supplierService.updateSupplier(this.data.supplier.id, payload)
        : this.supplierService.createSupplier(payload);

    request$.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: (supplier: Supplier) => {
        const action = this.mode === 'edit' ? 'updated' : 'created';
        this.snackBar.open(`Supplier ${action} successfully`, 'Close', {
          duration: 3000,
        });
        this.dialogRef.close({ action, supplier });
      },
      error: (error: unknown) => {
        console.error('Error saving supplier:', error);
        this.snackBar.open(
          'Failed to save supplier. Please try again.',
          'Close',
          {
            duration: 3500,
          }
        );
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'cancelled' });
  }

  private buildPayload(): SupplierFormData {
    const value = this.form.value;
    const normalize = (input: string | null | undefined): string | null => {
      if (input === null || input === undefined) {
        return null;
      }
      const trimmed = String(input).trim();
      return trimmed.length > 0 ? trimmed : null;
    };

    const creditLimit =
      value.creditLimit !== null &&
      value.creditLimit !== '' &&
      !isNaN(Number(value.creditLimit))
        ? Number(value.creditLimit)
        : null;

    const rating =
      value.rating !== null &&
      value.rating !== '' &&
      !isNaN(Number(value.rating))
        ? Number(value.rating)
        : null;

    const onTimeDeliveryRate =
      value.onTimeDeliveryRate !== null &&
      value.onTimeDeliveryRate !== '' &&
      !isNaN(Number(value.onTimeDeliveryRate))
        ? Number(value.onTimeDeliveryRate)
        : null;

    const averageLeadTimeDays =
      value.averageLeadTimeDays !== null &&
      value.averageLeadTimeDays !== '' &&
      !isNaN(Number(value.averageLeadTimeDays))
        ? Number(value.averageLeadTimeDays)
        : null;

    const address = {
      street: normalize(value.street),
      city: normalize(value.city),
      state: normalize(value.state),
      postalCode: normalize(value.postalCode),
      country: normalize(value.country) ?? 'Sri Lanka',
    };
    const hasAddress = Object.values(address).some(
      (v) => v !== null && v !== ''
    );

    const bankDetails = {
      bankName: normalize(value.bankName),
      accountNumber: normalize(value.accountNumber),
      accountName: normalize(value.accountName),
      branchCode: normalize(value.branchCode),
      swiftCode: normalize(value.swiftCode),
    };
    const hasBankDetails = Object.values(bankDetails).some(
      (v) => v !== null && v !== ''
    );

    const payload: SupplierFormData = {
      supplierCode: this.supplierCode ?? undefined,
      name: String(value.name).trim(),
      contactPerson: normalize(value.contactPerson),
      email: normalize(value.email),
      phone: normalize(value.phone),
      category: normalize(value.category),
      status: normalize(value.status),
      isActive:
        value.status && this.statuses.includes(value.status)
          ? value.status === 'active'
          : Boolean(value.isActive),
      isPreferred: Boolean(value.isPreferred),
      paymentTerms: normalize(value.paymentTerms),
      creditLimit,
      taxId: normalize(value.taxId),
      website: normalize(value.website),
      notes: normalize(value.notes),
      rating,
      onTimeDeliveryRate,
      averageLeadTimeDays,
    };

    if (hasAddress) {
      payload.address = address;
    }

    if (hasBankDetails) {
      payload.bankDetails = bankDetails;
    }

    return payload;
  }
}
