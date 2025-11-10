# Form Validation Standardization Guide

## Overview
This guide demonstrates how to use the standardized form validation system in Paradise POS.

## Components

### 1. FormErrorComponent
A reusable component for displaying form validation errors with consistent styling.

**Location:** `src/app/shared/components/form-error/`

**Features:**
- Automatic error message generation based on validation type
- Consistent styling with design system colors
- Smooth slide-in animation
- Support for common validators and custom error messages

### 2. Custom Validators
A collection of validators for common form validation scenarios.

**Location:** `src/app/shared/validators/custom-validators.ts`

**Available Validators:**
- `phone()` - Sri Lankan phone number format
- `url()` - Valid URL format
- `number()` - Numeric input
- `integer()` - Integer input only
- `positive()` - Positive numbers
- `negative()` - Negative numbers
- `alphanumeric()` - Letters and numbers only
- `noWhitespace()` - No whitespace-only input
- `strongPassword()` - Strong password requirements
- `match(fieldName)` - Field matching
- `minValue(min)` - Minimum numeric value
- `maxValue(max)` - Maximum numeric value
- `futureDate()` - Date must be in future
- `pastDate()` - Date must be in past
- `barcode()` - EAN-13 barcode format
- `sku()` - SKU format validation
- `percentage()` - 0-100 percentage
- `currency()` - Currency amount format

## Usage Examples

### Basic Example (Product Form)

```typescript
// product-form.component.ts
import { CustomValidators } from '../../../shared/validators/custom-validators';

productForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  sku: ['', [Validators.required, CustomValidators.sku()]],
  barcode: ['', [CustomValidators.barcode()]],
  price: ['', [Validators.required, CustomValidators.positive()]],
  costPrice: ['', [CustomValidators.positive()]],
  stock: ['', [Validators.required, CustomValidators.integer(), CustomValidators.minValue(0)]],
  description: ['', [Validators.maxLength(500), CustomValidators.noWhitespace()]]
});
```

```html
<!-- product-form.component.html -->
<mat-form-field appearance="outline">
  <mat-label>Product Name</mat-label>
  <input matInput formControlName="name">
</mat-form-field>
<app-form-error [control]="productForm.get('name')" fieldName="Product name"></app-form-error>

<mat-form-field appearance="outline">
  <mat-label>SKU</mat-label>
  <input matInput formControlName="sku">
</mat-form-field>
<app-form-error [control]="productForm.get('sku')" fieldName="SKU"></app-form-error>

<mat-form-field appearance="outline">
  <mat-label>Sale Price</mat-label>
  <input matInput type="number" formControlName="price">
  <span matPrefix>LKR&nbsp;</span>
</mat-form-field>
<app-form-error [control]="productForm.get('price')" fieldName="Sale price"></app-form-error>
```

### Customer Form Example

```typescript
// customer-form.component.ts
import { CustomValidators } from '../../../shared/validators/custom-validators';

customerForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  email: ['', [Validators.required, Validators.email]],
  phone: ['', [Validators.required, CustomValidators.phone()]],
  address: ['', [CustomValidators.noWhitespace()]],
  loyaltyPoints: [0, [CustomValidators.integer(), CustomValidators.minValue(0)]]
});
```

```html
<!-- customer-form.component.html -->
<mat-form-field appearance="outline">
  <mat-label>Phone Number</mat-label>
  <input matInput formControlName="phone" placeholder="+94 XX XXX XXXX">
</mat-form-field>
<app-form-error [control]="customerForm.get('phone')" fieldName="Phone number"></app-form-error>

<mat-form-field appearance="outline">
  <mat-label>Email Address</mat-label>
  <input matInput type="email" formControlName="email">
</mat-form-field>
<app-form-error [control]="customerForm.get('email')" fieldName="Email"></app-form-error>
```

### Role Editor Example

```typescript
// role-editor.component.ts
import { CustomValidators } from '../../../shared/validators/custom-validators';

roleForm = this.fb.group({
  name: ['', [Validators.required, Validators.minLength(3)]],
  description: ['', [Validators.required, Validators.minLength(10), CustomValidators.noWhitespace()]],
  priority: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
  color: ['#667eea', Validators.required]
});
```

```html
<!-- role-editor.component.html -->
<mat-form-field appearance="outline">
  <mat-label>Role Name</mat-label>
  <input matInput formControlName="name">
</mat-form-field>
<app-form-error [control]="roleForm.get('name')" fieldName="Role name"></app-form-error>

<mat-form-field appearance="outline">
  <mat-label>Priority Level</mat-label>
  <input matInput type="number" formControlName="priority" min="0" max="100">
  <mat-hint>Higher priority = more access (0-100)</mat-hint>
</mat-form-field>
<app-form-error [control]="roleForm.get('priority')" fieldName="Priority"></app-form-error>
```

### Password Form Example

```typescript
// user-form.component.ts
import { CustomValidators } from '../../../shared/validators/custom-validators';

userForm = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(8), CustomValidators.strongPassword()]],
  confirmPassword: ['', [Validators.required]]
}, {
  validators: [this.passwordMatchValidator]
});

private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { match: { matchField: 'Password' } };
}
```

```html
<!-- user-form.component.html -->
<mat-form-field appearance="outline">
  <mat-label>Password</mat-label>
  <input matInput type="password" formControlName="password">
  <mat-hint>Must contain uppercase, lowercase, number and special character</mat-hint>
</mat-form-field>
<app-form-error [control]="userForm.get('password')" fieldName="Password"></app-form-error>

<mat-form-field appearance="outline">
  <mat-label>Confirm Password</mat-label>
  <input matInput type="password" formControlName="confirmPassword">
</mat-form-field>
<app-form-error [control]="userForm.get('confirmPassword')" fieldName="Confirm password"></app-form-error>
```

## Styling

The `app-form-error` component automatically applies design system colors:
- Background: `$error-50`
- Border: `$error-600`
- Text: `$error-800`
- Icon: `$error-600`

## Benefits

1. **Consistency**: All forms use the same error display pattern
2. **Maintainability**: Update error messages in one place
3. **Reusability**: Add validators once, use everywhere
4. **User Experience**: Clear, consistent error messages
5. **Design System**: Matches color palette and styling

## Migration Guide

To update existing forms:

1. Import `CustomValidators` if needed
2. Replace inline error messages with `<app-form-error>`
3. Remove `mat-error` elements from Material form fields
4. Add appropriate validators to form controls

### Before:
```html
<mat-form-field appearance="outline">
  <mat-label>Product Name</mat-label>
  <input matInput formControlName="name">
  <mat-error *ngIf="hasError('name', 'required')">Product name is required</mat-error>
  <mat-error *ngIf="hasError('name', 'minlength')">Minimum 3 characters</mat-error>
</mat-form-field>
```

### After:
```html
<mat-form-field appearance="outline">
  <mat-label>Product Name</mat-label>
  <input matInput formControlName="name">
</mat-form-field>
<app-form-error [control]="productForm.get('name')" fieldName="Product name"></app-form-error>
```

## Forms to Update

1. ✅ product-form.component (Example provided above)
2. ⏳ customer-form.component
3. ⏳ category-management.component  
4. ⏳ role-editor.component
5. ⏳ stock-adjustments.component
6. ⏳ stock-transfers.component
7. ⏳ purchase-orders.component
8. ⏳ suppliers.component

## Next Steps

1. Review this guide
2. Decide which forms to migrate first
3. Apply validation pattern systematically
4. Test all form validations
5. Update any custom error messages as needed
