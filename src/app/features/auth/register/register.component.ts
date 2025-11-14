import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { BusinessType, RegisterRequest } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  businessTypes = [
    { value: BusinessType.RETAIL, label: 'Retail Store' },
    { value: BusinessType.RESTAURANT, label: 'Restaurant / Cafe' },
    { value: BusinessType.SALON, label: 'Salon / Spa' },
    { value: BusinessType.GROCERY, label: 'Grocery / Supermarket' },
    { value: BusinessType.PHARMACY, label: 'Pharmacy' },
    { value: BusinessType.ELECTRONICS, label: 'Electronics Store' },
    { value: BusinessType.CLOTHING, label: 'Clothing / Fashion' },
    { value: BusinessType.OTHER, label: 'Other' },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.pattern(/^[0-9]{10}$/)]],
        businessName: ['', [Validators.required, Validators.minLength(2)]],
        businessType: ['', [Validators.required]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        agreeToTerms: [false, [Validators.requiredTrue]],
      },
      {
        validators: this.passwordMatchValidator,
      }
    );
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    this.isLoading = true;
    const formValue = this.registerForm.value;

    const registerData: RegisterRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone || undefined,
      password: formValue.password,
      deviceName: 'web',
      roleSlug: 'admin',
      tenant: {
        name: formValue.businessName,
        businessType: formValue.businessType,
        country: 'LK',
        phone: formValue.phone || undefined,
      },
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.snackBar.open(
          'Registration successful! Welcome to Paradise POS',
          'Close',
          {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          }
        );
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        let errorMessage =
          error?.error?.message || 'Registration failed. Please try again.';

        const validationErrors = error?.error?.errors;
        if (validationErrors) {
          const firstKey = Object.keys(validationErrors)[0];
          const firstMessage =
            firstKey && validationErrors[firstKey]?.length
              ? validationErrors[firstKey][0]
              : null;
          if (firstMessage) {
            errorMessage = firstMessage;
          }
        }
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

    if (field?.hasError('required')) {
      return 'This field is required';
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }
    if (field?.hasError('pattern')) {
      if (fieldName === 'phone') {
        return 'Please enter a valid 10-digit phone number';
      }
    }
    if (
      fieldName === 'confirmPassword' &&
      this.registerForm.hasError('passwordMismatch')
    ) {
      return 'Passwords do not match';
    }
    return '';
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
