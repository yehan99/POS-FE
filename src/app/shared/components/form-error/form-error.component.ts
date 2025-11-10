import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-form-error',
  standalone: false,
  templateUrl: './form-error.component.html',
  styleUrl: './form-error.component.scss',
})
export class FormErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() fieldName: string = 'This field';

  // Common error messages
  private errorMessages: { [key: string]: (params?: any) => string } = {
    required: () => `${this.fieldName} is required`,
    email: () => `Please enter a valid email address`,
    minlength: (params) =>
      `${this.fieldName} must be at least ${params.requiredLength} characters`,
    maxlength: (params) =>
      `${this.fieldName} cannot exceed ${params.requiredLength} characters`,
    min: (params) => `Minimum value is ${params.min}`,
    max: (params) => `Maximum value is ${params.max}`,
    pattern: () => `${this.fieldName} format is invalid`,
    phone: () => `Please enter a valid phone number`,
    url: () => `Please enter a valid URL`,
    date: () => `Please enter a valid date`,
    number: () => `${this.fieldName} must be a number`,
    integer: () => `${this.fieldName} must be a whole number`,
    positive: () => `${this.fieldName} must be positive`,
    negative: () => `${this.fieldName} must be negative`,
    alphanumeric: () =>
      `${this.fieldName} can only contain letters and numbers`,
    whitespace: () => `${this.fieldName} cannot contain only whitespace`,
    unique: () => `${this.fieldName} already exists`,
    match: (params) => `${this.fieldName} must match ${params.matchField}`,
    strongPassword: () =>
      'Password must contain uppercase, lowercase, number and special character',
  };

  get errorMessage(): string | null {
    if (!this.control || !this.control.errors || !this.control.touched) {
      return null;
    }

    const errors = this.control.errors;
    const firstErrorKey = Object.keys(errors)[0];

    if (this.errorMessages[firstErrorKey]) {
      return this.errorMessages[firstErrorKey](errors[firstErrorKey]);
    }

    // Fallback for custom error messages
    if (typeof errors[firstErrorKey] === 'string') {
      return errors[firstErrorKey];
    }

    return `${this.fieldName} is invalid`;
  }

  get hasError(): boolean {
    return !!(this.control && this.control.invalid && this.control.touched);
  }
}
