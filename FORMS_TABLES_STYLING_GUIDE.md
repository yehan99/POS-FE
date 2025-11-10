# Paradise POS - Luxury Forms & Tables Styling Guide

## Overview

This guide provides comprehensive documentation for using the elegant, luxury-styled forms and tables throughout the Paradise POS application. The styling system is built on a refined design system with deep navy and gold accents, ensuring a consistent, professional appearance.

---

## 🎨 Design Philosophy

- **Elegant & Refined**: Subtle shadows, smooth transitions, and refined spacing
- **User-Friendly**: Clear visual feedback for all interactions
- **Accessible**: Proper focus states, color contrast, and keyboard navigation
- **Consistent**: Unified design language across all components
- **Responsive**: Mobile-first approach with adaptive layouts

---

## 📋 Table of Contents

1. [Form Components](#form-components)
   - [Input Fields](#input-fields)
   - [Textareas](#textareas)
   - [Select Dropdowns](#select-dropdowns)
   - [Checkboxes](#checkboxes)
   - [Radio Buttons](#radio-buttons)
   - [Switches/Toggles](#switches-toggles)
   - [Buttons](#buttons)
   - [Form Layouts](#form-layouts)
2. [Table Components](#table-components)
   - [Basic Table](#basic-table)
   - [Table Variants](#table-variants)
   - [Pagination](#pagination)
   - [Status Badges](#status-badges)
   - [Responsive Tables](#responsive-tables)
3. [Validation & Feedback](#validation-feedback)
4. [Best Practices](#best-practices)

---

## Form Components

### Input Fields

#### Basic Input
```html
<div class="form-group">
  <label class="form-label required">Email Address</label>
  <input type="email" class="form-input" placeholder="Enter your email" />
  <span class="form-helper">We'll never share your email</span>
</div>
```

#### Input States
```html
<!-- Error State -->
<input type="text" class="form-input error" />
<div class="form-error">This field is required</div>

<!-- Success State -->
<input type="text" class="form-input success" />
<div class="form-success">Looks good!</div>

<!-- Disabled State -->
<input type="text" class="form-input" disabled />
```

#### Search Input
```html
<div class="search-input-wrapper">
  <mat-icon class="search-icon">search</mat-icon>
  <input type="text" class="form-input" placeholder="Search..." />
  <mat-icon class="clear-icon">close</mat-icon>
</div>
```

#### Input Group (with prefix/suffix)
```html
<div class="input-group">
  <span class="input-group-prepend">Rs.</span>
  <input type="number" class="form-input" placeholder="0.00" />
  <span class="input-group-append">.00</span>
</div>
```

---

### Textareas

```html
<div class="form-group">
  <label class="form-label">Description</label>
  <textarea class="form-textarea" rows="4" placeholder="Enter description..."></textarea>
  <span class="form-helper">Max 500 characters</span>
</div>
```

**Properties:**
- Default min-height: 96px
- Vertical resize enabled
- Same states as input fields

---

### Select Dropdowns

```html
<div class="form-group">
  <label class="form-label required">Category</label>
  <select class="form-select">
    <option value="">Select category...</option>
    <option value="electronics">Electronics</option>
    <option value="clothing">Clothing</option>
    <option value="food">Food & Beverages</option>
  </select>
</div>
```

**Features:**
- Custom arrow indicator (gold accent on hover)
- Smooth transitions
- Consistent styling with inputs

---

### Checkboxes

#### Single Checkbox
```html
<div class="checkbox-wrapper">
  <input type="checkbox" id="terms" />
  <label for="terms">I agree to the terms and conditions</label>
</div>
```

#### Multiple Checkboxes
```html
<div class="form-group">
  <label class="form-label">Permissions</label>
  <div class="checkbox-wrapper">
    <input type="checkbox" id="read" checked />
    <label for="read">Read</label>
  </div>
  <div class="checkbox-wrapper">
    <input type="checkbox" id="write" />
    <label for="write">Write</label>
  </div>
  <div class="checkbox-wrapper">
    <input type="checkbox" id="delete" disabled />
    <label for="delete">Delete (disabled)</label>
  </div>
</div>
```

**Design:**
- 20x20px square with rounded corners
- Gold accent (#d4a574) when checked
- White checkmark on accent background
- Smooth transition on state change

---

### Radio Buttons

```html
<div class="form-group">
  <label class="form-label">Payment Method</label>
  <div class="radio-group">
    <div class="radio-wrapper">
      <input type="radio" id="cash" name="payment" checked />
      <label for="cash">Cash</label>
    </div>
    <div class="radio-wrapper">
      <input type="radio" id="card" name="payment" />
      <label for="card">Credit/Debit Card</label>
    </div>
    <div class="radio-wrapper">
      <input type="radio" id="mobile" name="payment" />
      <label for="mobile">Mobile Payment</label>
    </div>
  </div>
</div>
```

**Design:**
- 20x20px circular
- Gold dot (8x8px) when selected
- Smooth animation on selection

---

### Switches/Toggles

```html
<div class="switch-wrapper">
  <input type="checkbox" id="notifications" />
  <label for="notifications">Enable notifications</label>
</div>
```

**Design:**
- 44x24px toggle track
- 20x20px circular thumb
- Slides from left to right when enabled
- Gold background when active

---

### Buttons

#### Button Variants

```html
<!-- Primary Button -->
<button class="btn btn-primary">
  <mat-icon>save</mat-icon>
  Save Changes
</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Cancel</button>

<!-- Accent Button -->
<button class="btn btn-accent">
  <mat-icon>add</mat-icon>
  Add New
</button>

<!-- Danger Button -->
<button class="btn btn-danger">
  <mat-icon>delete</mat-icon>
  Delete
</button>

<!-- Success Button -->
<button class="btn btn-success">Approve</button>

<!-- Ghost Button -->
<button class="btn btn-ghost">More Options</button>

<!-- Link Button -->
<button class="btn btn-link">Learn More</button>
```

#### Button Sizes

```html
<!-- Small -->
<button class="btn btn-primary btn-sm">Small</button>

<!-- Default -->
<button class="btn btn-primary">Default</button>

<!-- Large -->
<button class="btn btn-primary btn-lg">Large</button>

<!-- Full Width -->
<button class="btn btn-primary btn-block">Full Width</button>
```

#### Button States

```html
<!-- Disabled -->
<button class="btn btn-primary" disabled>Disabled</button>

<!-- Loading (with custom component) -->
<button class="btn btn-primary" disabled>
  <mat-spinner diameter="20"></mat-spinner>
  Loading...
</button>
```

#### Button Groups

```html
<div class="btn-group">
  <button class="btn btn-secondary">Left</button>
  <button class="btn btn-secondary">Middle</button>
  <button class="btn btn-secondary">Right</button>
</div>

<!-- Vertical -->
<div class="btn-group vertical">
  <button class="btn btn-secondary">Top</button>
  <button class="btn btn-secondary">Middle</button>
  <button class="btn btn-secondary">Bottom</button>
</div>
```

---

### Form Layouts

#### Two-Column Form
```html
<form>
  <div class="form-row cols-2">
    <div class="form-group">
      <label class="form-label required">First Name</label>
      <input type="text" class="form-input" />
    </div>
    <div class="form-group">
      <label class="form-label required">Last Name</label>
      <input type="text" class="form-input" />
    </div>
  </div>

  <div class="form-group">
    <label class="form-label required">Email</label>
    <input type="email" class="form-input" />
  </div>

  <div class="btn-group">
    <button type="submit" class="btn btn-primary">Submit</button>
    <button type="button" class="btn btn-secondary">Cancel</button>
  </div>
</form>
```

#### Three/Four-Column Form
```html
<div class="form-row cols-3">
  <div class="form-group">...</div>
  <div class="form-group">...</div>
  <div class="form-group">...</div>
</div>

<div class="form-row cols-4">
  <div class="form-group">...</div>
  <div class="form-group">...</div>
  <div class="form-group">...</div>
  <div class="form-group">...</div>
</div>
```

**Note:** Form rows automatically stack on mobile (<768px)

#### Required Fields Note
```html
<div class="required-fields-note">
  Fields marked with an asterisk are required
</div>
```

---

## Table Components

### Basic Table

```html
<div class="table-container">
  <table class="luxury-table">
    <thead>
      <tr>
        <th class="sortable sorted-asc">Product Name</th>
        <th class="sortable">Price</th>
        <th class="sortable">Stock</th>
        <th>Status</th>
        <th class="text-center">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-bold">iPhone 14 Pro</td>
        <td>Rs. 329,999.00</td>
        <td>42</td>
        <td>
          <span class="status-badge status-active">Active</span>
        </td>
        <td class="text-center">
          <div class="table-actions">
            <button class="action-btn view-btn">
              <mat-icon>visibility</mat-icon>
            </button>
            <button class="action-btn edit-btn">
              <mat-icon>edit</mat-icon>
            </button>
            <button class="action-btn delete-btn">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </td>
      </tr>
      <!-- More rows... -->
    </tbody>
  </table>
</div>
```

---

### Table with Header & Filters

```html
<div class="table-wrapper">
  <div class="table-header">
    <h2 class="table-title">Products</h2>
    <div class="table-actions">
      <button class="btn btn-secondary btn-sm">
        <mat-icon>file_download</mat-icon>
        Export
      </button>
      <button class="btn btn-primary btn-sm">
        <mat-icon>add</mat-icon>
        Add Product
      </button>
    </div>
  </div>

  <div class="table-filters">
    <div class="search-input-wrapper">
      <mat-icon class="search-icon">search</mat-icon>
      <input type="text" class="form-input" placeholder="Search products..." />
    </div>
    <select class="form-select">
      <option>All Categories</option>
      <option>Electronics</option>
      <option>Clothing</option>
    </select>
    <select class="form-select">
      <option>All Status</option>
      <option>Active</option>
      <option>Inactive</option>
    </select>
  </div>

  <div class="table-container">
    <table class="luxury-table">
      <!-- table content -->
    </table>
  </div>

  <div class="table-pagination">
    <!-- pagination controls -->
  </div>
</div>
```

---

### Table Variants

#### Compact Table
```html
<table class="luxury-table compact">
  <!-- Smaller padding, tighter spacing -->
</table>
```

#### Bordered Table
```html
<table class="luxury-table bordered">
  <!-- Vertical borders between columns -->
</table>
```

#### Striped Table
```html
<table class="luxury-table striped">
  <!-- Enhanced row alternation -->
</table>
```

---

### Pagination

```html
<div class="table-pagination">
  <div class="pagination-info">
    Showing <span class="count-highlight">1-10</span> of <span class="count-highlight">243</span> results
  </div>

  <div class="pagination-controls">
    <button class="page-btn" disabled>
      <mat-icon>chevron_left</mat-icon>
    </button>
    <button class="page-btn active">1</button>
    <button class="page-btn">2</button>
    <button class="page-btn">3</button>
    <span class="page-ellipsis">...</span>
    <button class="page-btn">25</button>
    <button class="page-btn">
      <mat-icon>chevron_right</mat-icon>
    </button>
  </div>

  <div class="per-page-selector">
    <span>Show</span>
    <select>
      <option>10</option>
      <option>25</option>
      <option selected>50</option>
      <option>100</option>
    </select>
    <span>per page</span>
  </div>
</div>
```

---

### Status Badges

```html
<span class="status-badge status-active">Active</span>
<span class="status-badge status-inactive">Inactive</span>
<span class="status-badge status-pending">Pending</span>
<span class="status-badge status-completed">Completed</span>
<span class="status-badge status-cancelled">Cancelled</span>
<span class="status-badge status-draft">Draft</span>
```

---

### Row States

```html
<!-- Selected Row -->
<tr class="selected">...</tr>

<!-- Active Row -->
<tr class="active">...</tr>

<!-- Inactive Row -->
<tr class="inactive">...</tr>

<!-- Warning Row -->
<tr class="warning">...</tr>

<!-- Danger Row -->
<tr class="danger">...</tr>

<!-- Clickable Row -->
<tr class="clickable" (click)="handleRowClick()">...</tr>
```

---

### Empty State

```html
<tbody>
  <tr>
    <td colspan="5" class="table-empty">
      <div class="empty-icon">📦</div>
      <div class="empty-title">No products found</div>
      <div class="empty-message">Try adjusting your filters or add a new product</div>
    </td>
  </tr>
</tbody>
```

---

### Responsive Tables

```html
<table class="luxury-table responsive">
  <thead>
    <tr>
      <th>Name</th>
      <th>Price</th>
      <th>Stock</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">iPhone 14 Pro</td>
      <td data-label="Price">Rs. 329,999.00</td>
      <td data-label="Stock">42</td>
    </tr>
  </tbody>
</table>
```

**Note:** On mobile (<768px), the table transforms to a card-based layout using `data-label` attributes.

---

## Validation & Feedback

### Form Error Component Integration

The existing `FormErrorComponent` works seamlessly with the luxury styling:

```html
<div class="form-group">
  <label class="form-label required">Username</label>
  <input
    type="text"
    class="form-input"
    [class.error]="usernameControl.invalid && usernameControl.touched"
    formControlName="username"
  />
  <app-form-error [control]="usernameControl"></app-form-error>
</div>
```

### Manual Validation Messages

```html
<!-- Error -->
<div class="form-error">
  Username must be at least 3 characters
</div>

<!-- Success -->
<div class="form-success">
  Username is available
</div>

<!-- Helper text -->
<span class="form-helper">
  Use letters, numbers, and underscores only
</span>
```

---

## Best Practices

### Forms

1. **Always use labels**: Every input should have an associated label for accessibility
2. **Mark required fields**: Use the `.required` class on labels
3. **Provide helper text**: Guide users with helpful hints below inputs
4. **Show validation**: Display errors only after user interaction (touched)
5. **Consistent spacing**: Use `form-group` for vertical rhythm
6. **Logical grouping**: Use `form-row` for related fields
7. **Appropriate input types**: Use type="email", type="tel", type="number" etc.
8. **Disable during submission**: Prevent double-submission with disabled state
9. **Clear error messages**: Be specific about what's wrong and how to fix it
10. **Mobile-friendly**: Forms automatically stack on mobile devices

### Tables

1. **Use proper semantics**: Always use `<thead>`, `<tbody>`, and `<th>` tags
2. **Sortable columns**: Add `sortable` class and handle click events
3. **Responsive design**: Use `.responsive` class for mobile-friendly tables
4. **Empty states**: Always provide feedback when no data exists
5. **Loading states**: Show spinners during data fetching
6. **Pagination**: Implement for tables with >25 rows
7. **Action buttons**: Group actions in a dedicated column
8. **Status indicators**: Use status badges for clear visual communication
9. **Hover feedback**: Tables provide hover effects by default
10. **Accessibility**: Use `scope="col"` on header cells

### Performance

1. **Lazy load data**: Don't load all records at once
2. **Virtual scrolling**: For very large tables, consider virtual scrolling
3. **Debounce search**: Add 300ms delay to search inputs
4. **Optimize selectors**: Avoid deep nesting in custom styles
5. **Cache form values**: Save draft data to localStorage

### Accessibility

1. **Keyboard navigation**: All controls must be keyboard accessible
2. **Focus indicators**: Never remove focus outlines (custom ones provided)
3. **Color contrast**: All text meets WCAG AA standards
4. **Screen readers**: Use semantic HTML and ARIA labels where needed
5. **Error announcements**: Use ARIA live regions for dynamic errors

---

## Design Tokens Reference

### Colors
- **Primary**: Deep navy (#102a43 to #627d98)
- **Accent**: Elegant gold (#d4a574 to #ffc857)
- **Success**: #48bb78
- **Warning**: #ed8936
- **Error**: #f56565
- **Info**: #4299e1

### Spacing
- Form group margin: 24px (spacing-6)
- Input padding: 12px 16px
- Button padding: 12px 24px

### Typography
- Input font: Inter (16px)
- Label font: Inter Semibold (14px)
- Button font: Inter Semibold (16px)

### Transitions
- Fast: 150ms
- Base: 250ms
- Slow: 350ms

### Border Radius
- Inputs/Buttons: 8px (radius-md)
- Cards/Tables: 16px (radius-xl)

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

All styles use modern CSS with graceful degradation for older browsers.

---

## Questions or Issues?

If you encounter any styling inconsistencies or have suggestions for improvements, please contact the development team or create an issue in the project repository.

**Last Updated**: January 2025  
**Version**: 1.0.0
