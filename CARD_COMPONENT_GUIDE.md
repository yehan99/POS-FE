# Luxury Card Component Guide

## Overview
The `CardComponent` is a reusable, elegant card component with multiple variants for consistent design across the Paradise POS application.

## Features
- ✨ 4 stunning variants: default, elevated, outlined, interactive
- 📏 4 padding sizes: none, small, medium, large
- 🎨 Luxury design with deep navy & gold accents
- 🖱️ Optional hover effects and click handling
- 📱 Fully responsive
- ⚡ Smooth animations and transitions

## Basic Usage

### Import
The component is available through `SharedModule`:

```typescript
import { SharedModule } from '@app/shared/shared.module';

@NgModule({
  imports: [SharedModule]
})
export class YourModule { }
```

### Simple Card
```html
<app-card>
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-content">
    Your content here
  </div>
</app-card>
```

## Variants

### Default (Subtle Shadow)
```html
<app-card variant="default">
  Standard card with subtle shadow
</app-card>
```

### Elevated (Prominent Shadow)
```html
<app-card variant="elevated">
  Card with prominent shadow for emphasis
</app-card>
```

### Outlined (Border Focus)
```html
<app-card variant="outlined">
  Card with border instead of shadow
</app-card>
```

### Interactive (Clickable)
```html
<app-card variant="interactive" (click)="handleClick()">
  Clickable card with hover animation
</app-card>
```

## Padding Options

```html
<app-card padding="none">No padding</app-card>
<app-card padding="small">Small padding (16px)</app-card>
<app-card padding="medium">Medium padding (24px) - Default</app-card>
<app-card padding="large">Large padding (32px)</app-card>
```

## Modifiers

### Hoverable
Adds subtle lift effect on hover:
```html
<app-card [hoverable]="true">
  Hovers on mouseover
</app-card>
```

### Clickable
Makes card clickable with feedback:
```html
<app-card [clickable]="true" (click)="handleClick()">
  Clickable with press animation
</app-card>
```

### Full Height
Stretches card to fill container height:
```html
<app-card [fullHeight]="true">
  Takes full height of parent
</app-card>
```

## Card Structure

### Header with Title and Actions
```html
<app-card>
  <div class="card-header">
    <div>
      <h3 class="card-title">
        <mat-icon>dashboard</mat-icon>
        Dashboard Stats
      </h3>
      <p class="card-subtitle">Last updated: 2 minutes ago</p>
    </div>
    <div class="card-actions">
      <button mat-icon-button>
        <mat-icon>more_vert</mat-icon>
      </button>
    </div>
  </div>
  <div class="card-content">
    <!-- Your content -->
  </div>
</app-card>
```

### Footer
```html
<app-card>
  <div class="card-content">
    Main content
  </div>
  <div class="card-footer">
    <span>Total: LKR 12,500</span>
    <button mat-button color="primary">View Details</button>
  </div>
</app-card>
```

## Complete Examples

### Dashboard KPI Card
```html
<app-card variant="elevated" [hoverable]="true" padding="large">
  <div class="card-content">
    <div style="display: flex; gap: 20px; align-items: center;">
      <div style="width: 72px; height: 72px; border-radius: 16px; background: linear-gradient(135deg, #486581, #102a43); display: flex; align-items: center; justify-content: center;">
        <mat-icon style="color: white; font-size: 36px; width: 36px; height: 36px;">paid</mat-icon>
      </div>
      <div style="flex: 1;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600;">TODAY'S SALES</p>
        <p style="margin: 0 0 12px 0; font-size: 32px; font-weight: 700; color: #102a43;">LKR 125,000</p>
        <p style="margin: 0; font-size: 14px; color: #10b981; font-weight: 600;">
          <mat-icon style="font-size: 20px; width: 20px; height: 20px; vertical-align: middle;">trending_up</mat-icon>
          +12.5%
        </p>
      </div>
    </div>
  </div>
</app-card>
```

### Interactive Feature Card
```html
<app-card variant="interactive" (click)="navigateTo('/pos')">
  <div class="card-content" style="text-align: center; padding: 40px 20px;">
    <mat-icon style="font-size: 48px; width: 48px; height: 48px; color: #d4a574; margin-bottom: 16px;">
      point_of_sale
    </mat-icon>
    <h3 style="margin: 0 0 8px 0; color: #102a43; font-size: 20px; font-weight: 600;">
      Point of Sale
    </h3>
    <p style="margin: 0; color: #6c757d; font-size: 14px;">
      Start new transaction
    </p>
  </div>
</app-card>
```

### List Card with Footer
```html
<app-card padding="none">
  <div class="card-header" style="padding: 24px 24px 16px;">
    <h3 class="card-title">
      <mat-icon>receipt_long</mat-icon>
      Recent Transactions
    </h3>
    <button mat-button color="primary">View All</button>
  </div>
  <div class="card-content" style="padding: 0 24px;">
    <div *ngFor="let transaction of transactions" style="padding: 16px 0; border-bottom: 1px solid #e9ecef;">
      <!-- Transaction item -->
    </div>
  </div>
  <div class="card-footer" style="padding: 16px 24px;">
    <span>Showing 5 of 125 transactions</span>
    <button mat-stroked-button>Load More</button>
  </div>
</app-card>
```

## Grid Layouts

### Responsive Card Grid
```html
<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
  <app-card variant="elevated" *ngFor="let item of items">
    <!-- Card content -->
  </app-card>
</div>
```

## Design Tokens Used

- **Border Radius**: 12px (`$radius-xl`)
- **Shadows**: Varies by variant (sm, md, lg, xl, 2xl)
- **Transitions**: 250ms ease-in-out
- **Colors**: 
  - Background: `$background` (#ffffff)
  - Border: `$border-light` (#f1f3f5)
  - Accent: `$accent-500` (#d4a574)
  - Primary: `$primary-900` (#102a43)

## Best Practices

1. **Use appropriate variants**:
   - `default`: Most content cards
   - `elevated`: Important information, CTAs
   - `outlined`: Form sections, settings
   - `interactive`: Navigation cards, action tiles

2. **Padding guidelines**:
   - `none`: When using custom padding per section
   - `small`: Compact lists, sidebar widgets
   - `medium`: Standard content (default)
   - `large`: Dashboard metrics, featured content

3. **Accessibility**:
   - Use semantic HTML inside cards
   - Add `role="button"` and keyboard handlers for clickable cards
   - Ensure sufficient color contrast

4. **Performance**:
   - Avoid excessive nesting
   - Use `trackBy` in `*ngFor` loops
   - Lazy load card content when possible

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- All modern mobile browsers
