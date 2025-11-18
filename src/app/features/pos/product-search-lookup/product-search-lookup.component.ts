import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Product } from '../../../core/models';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-search-lookup',
  standalone: false,
  templateUrl: './product-search-lookup.component.html',
  styleUrl: './product-search-lookup.component.scss',
})
export class ProductSearchLookupComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Output() productSelected = new EventEmitter<Product>();

  searchControl = new FormControl('');
  searchResults$: Observable<Product[]>;
  isSearching: boolean = false;

  constructor(private productService: ProductService) {
    this.searchResults$ = this.productService.searchResults$;
  }

  displayProduct(product: Product | null): string {
    return product ? product.name : '';
  }

  ngOnInit(): void {
    // Subscribe to search results to manage loading spinner
    this.searchResults$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isSearching = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string | Product | null): void {
    const term = typeof value === 'string' ? value : '';
    if (term.length >= 2) {
      this.isSearching = true;
      this.productService.search(term);
    } else {
      this.isSearching = false;
      this.productService.search('');
    }
  }

  onOptionSelected(product: Product): void {
    this.productSelected.emit(product);
    this.searchControl.setValue('');
    this.isSearching = false;
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.isSearching = false;
    this.productService.search('');
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toFixed(2)}`;
  }
}
