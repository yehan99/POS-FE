import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Custom validators for form validation
 */
export class CustomValidators {
  /**
   * Validates phone number format
   */
  static phone(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      // Sri Lankan phone number format: +94XXXXXXXXX or 0XXXXXXXXX
      const phoneRegex = /^(\+94|0)?[0-9]{9}$/;
      const valid = phoneRegex.test(control.value.replace(/\s/g, ''));

      return valid ? null : { phone: true };
    };
  }

  /**
   * Validates URL format
   */
  static url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        new URL(control.value);
        return null;
      } catch {
        return { url: true };
      }
    };
  }

  /**
   * Validates numeric input
   */
  static number(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = !isNaN(control.value);
      return valid ? null : { number: true };
    };
  }

  /**
   * Validates integer input
   */
  static integer(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = Number.isInteger(Number(control.value));
      return valid ? null : { integer: true };
    };
  }

  /**
   * Validates positive number
   */
  static positive(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = Number(control.value) > 0;
      return valid ? null : { positive: true };
    };
  }

  /**
   * Validates negative number
   */
  static negative(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = Number(control.value) < 0;
      return valid ? null : { negative: true };
    };
  }

  /**
   * Validates alphanumeric input
   */
  static alphanumeric(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      const valid = alphanumericRegex.test(control.value);

      return valid ? null : { alphanumeric: true };
    };
  }

  /**
   * Validates that input is not only whitespace
   */
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = control.value.trim().length > 0;
      return valid ? null : { whitespace: true };
    };
  }

  /**
   * Validates strong password
   * Must contain: uppercase, lowercase, number, and special character
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const hasUppercase = /[A-Z]/.test(control.value);
      const hasLowercase = /[a-z]/.test(control.value);
      const hasNumber = /[0-9]/.test(control.value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(control.value);

      const valid = hasUppercase && hasLowercase && hasNumber && hasSpecial;
      return valid ? null : { strongPassword: true };
    };
  }

  /**
   * Validates that two fields match
   */
  static match(matchField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) {
        return null;
      }

      const matchControl = control.parent.get(matchField);
      if (!matchControl) {
        return null;
      }

      const valid = control.value === matchControl.value;
      return valid ? null : { match: { matchField } };
    };
  }

  /**
   * Validates minimum value
   */
  static minValue(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = Number(control.value) >= min;
      return valid ? null : { min: { min, actual: control.value } };
    };
  }

  /**
   * Validates maximum value
   */
  static maxValue(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const valid = Number(control.value) <= max;
      return valid ? null : { max: { max, actual: control.value } };
    };
  }

  /**
   * Validates date is not in the past
   */
  static futureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const valid = inputDate >= today;
      return valid ? null : { date: true };
    };
  }

  /**
   * Validates date is not in the future
   */
  static pastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const valid = inputDate <= today;
      return valid ? null : { date: true };
    };
  }

  /**
   * Validates barcode format (EAN-13)
   */
  static barcode(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const barcodeRegex = /^[0-9]{13}$/;
      const valid = barcodeRegex.test(control.value);

      return valid ? null : { pattern: true };
    };
  }

  /**
   * Validates SKU format
   */
  static sku(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      // SKU format: Alphanumeric, hyphens, underscores
      const skuRegex = /^[A-Z0-9-_]+$/i;
      const valid = skuRegex.test(control.value);

      return valid ? null : { pattern: true };
    };
  }

  /**
   * Validates percentage (0-100)
   */
  static percentage(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const value = Number(control.value);
      const valid = value >= 0 && value <= 100;

      return valid ? null : { min: { min: 0 }, max: { max: 100 } };
    };
  }

  /**
   * Validates currency amount (positive with 2 decimal places)
   */
  static currency(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const currencyRegex = /^\d+(\.\d{1,2})?$/;
      const valid =
        currencyRegex.test(control.value) && Number(control.value) >= 0;

      return valid ? null : { pattern: true };
    };
  }
}
