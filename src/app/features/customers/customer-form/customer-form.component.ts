import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { CustomerService } from '../services/customer.service';
import {
  Customer,
  CustomerFormData,
  LoyaltyTier,
} from '../models/customer.model';

@Component({
  selector: 'app-customer-form',
  standalone: false,
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
})
export class CustomerFormComponent implements OnInit {
  customerForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSaving = false;
  customerId: string | null = null;
  customerCode: string = '';

  readonly formSkeletonSlots = Array.from({ length: 8 });

  loyaltyTiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum'];
  genders = ['male', 'female', 'other'];

  constructor(
    private fb: FormBuilder,
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.customerId;

    this.createForm();

    if (this.isEditMode && this.customerId) {
      this.loadCustomer(this.customerId);
    } else {
      this.generateCustomerCode();
    }
  }

  createForm(): void {
    this.customerForm = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      email: ['', [Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      dateOfBirth: [''],
      gender: [''],
      // Address fields
      street: [''],
      city: [''],
      state: [''],
      postalCode: [''],
      country: ['Sri Lanka', Validators.required],
      // Loyalty fields
      loyaltyPoints: [{ value: 0, disabled: true }],
      loyaltyTier: [{ value: 'bronze', disabled: !this.isEditMode }],
      notes: ['', Validators.maxLength(500)],
      isActive: [true],
    });
  }

  loadCustomer(id: string): void {
    this.isLoading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.populateForm(customer);
        this.customerCode = customer.customerCode;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.snackBar.open('Failed to load customer', 'Close', {
          duration: 3000,
        });
        this.isLoading = false;
        this.router.navigate(['/customers']);
      },
    });
  }

  populateForm(customer: Customer): void {
    this.customerForm.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email || '',
      phone: customer.phone,
      dateOfBirth: customer.dateOfBirth || '',
      gender: customer.gender || '',
      street: customer.address?.street || '',
      city: customer.address?.city || '',
      state: customer.address?.state || '',
      postalCode: customer.address?.postalCode || '',
      country: customer.address?.country || 'Sri Lanka',
      loyaltyPoints: customer.loyaltyPoints,
      loyaltyTier: customer.loyaltyTier,
      notes: customer.notes || '',
      isActive: customer.isActive,
    });
  }

  generateCustomerCode(): void {
    this.customerService.generateCustomerCode().subscribe({
      next: (code) => {
        this.customerCode = code;
      },
      error: (error) => {
        console.error('Error generating customer code:', error);
        this.customerCode = 'CUST' + Date.now();
      },
    });
  }

  onSubmit(): void {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      this.snackBar.open(
        'Please fill in all required fields correctly',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.isSaving = true;
    const formValue = this.customerForm.getRawValue();

    const customerData: CustomerFormData = {
      customerCode: this.customerCode || undefined,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email || undefined,
      phone: formValue.phone,
      dateOfBirth: formValue.dateOfBirth || undefined,
      gender: formValue.gender || undefined,
      address: {
        street: formValue.street || undefined,
        city: formValue.city || undefined,
        state: formValue.state || undefined,
        postalCode: formValue.postalCode || undefined,
        country: formValue.country,
      },
      loyaltyPoints: formValue.loyaltyPoints,
      loyaltyTier: formValue.loyaltyTier,
      notes: formValue.notes || undefined,
      isActive: formValue.isActive,
    };

    const operation =
      this.isEditMode && this.customerId
        ? this.customerService.updateCustomer(this.customerId, customerData)
        : this.customerService.createCustomer(customerData);

    operation.pipe(finalize(() => (this.isSaving = false))).subscribe({
      next: (customer) => {
        this.snackBar.open(
          `Customer ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/customers', customer.id]);
      },
      error: (error) => {
        console.error('Error saving customer:', error);
        this.snackBar.open(
          `Failed to ${this.isEditMode ? 'update' : 'create'} customer`,
          'Close',
          { duration: 3000 }
        );
      },
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.customerId) {
      this.router.navigate(['/customers', this.customerId]);
    } else {
      this.router.navigate(['/customers']);
    }
  }

  // Helper methods for validation
  hasError(fieldName: string, errorType: string): boolean {
    const control = this.customerForm.get(fieldName);
    return !!(
      control &&
      control.hasError(errorType) &&
      (control.dirty || control.touched)
    );
  }

  getErrorMessage(fieldName: string): string {
    const control = this.customerForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Minimum length is ${minLength} characters`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Maximum length is ${maxLength} characters`;
    }
    if (control?.hasError('pattern')) {
      if (fieldName === 'phone') {
        return 'Phone number must be 10 digits';
      }
      return 'Invalid format';
    }

    return '';
  }

  getTierColor(tier: LoyaltyTier): string {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return colors[tier];
  }

  getTierDescription(tier: LoyaltyTier): string {
    const descriptions = {
      bronze: 'Entry level tier for new customers',
      silver: 'For customers who have spent over LKR 50,000',
      gold: 'For customers who have spent over LKR 200,000',
      platinum: 'Premium tier for customers who have spent over LKR 500,000',
    };
    return descriptions[tier];
  }
}
