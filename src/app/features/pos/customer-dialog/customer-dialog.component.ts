import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
} from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerService } from '../../../features/customers/services/customer.service';
import { Customer } from '../../../features/customers/models/customer.model';

export interface CustomerDialogData {
  customerId?: string;
}

export interface CustomerDialogResult {
  customer: Customer;
}

@Component({
  selector: 'app-customer-dialog',
  standalone: false,
  templateUrl: './customer-dialog.component.html',
  styleUrls: ['./customer-dialog.component.scss'],
})
export class CustomerDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  searchControl = new FormControl('');
  searchResults$!: Observable<Customer[]>;
  isSearching = false;
  selectedCustomer: Customer | null = null;

  constructor(
    private customerService: CustomerService,
    private dialogRef: MatDialogRef<CustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerDialogData
  ) {}

  ngOnInit(): void {
    // Set up debounced search similar to product search
    this.searchResults$ = this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((searchTerm: string | Customer | null) => {
        const term = typeof searchTerm === 'string' ? searchTerm : '';

        if (term.length < 2) {
          return of([]);
        }

        this.isSearching = true;
        return this.customerService.searchCustomers(term).pipe(
          catchError((error) => {
            console.error('Customer search error:', error);
            this.isSearching = false;
            return of([]);
          })
        );
      }),
      takeUntil(this.destroy$)
    );

    // Subscribe to manage loading state
    this.searchResults$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.isSearching = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string | Customer | null): void {
    const term = typeof value === 'string' ? value : '';
    if (term.length < 2) {
      this.isSearching = false;
    }
  }

  onCustomerSelected(customer: Customer): void {
    this.selectedCustomer = customer;
    this.searchControl.setValue('');
    this.isSearching = false;
  }

  displayCustomer = (customer: Customer | null): string => {
    if (!customer) return '';
    const name = `${customer.firstName || ''} ${
      customer.lastName || ''
    }`.trim();
    return name || customer.phone || '';
  };

  confirmSelection(): void {
    if (this.selectedCustomer) {
      this.dialogRef.close({ customer: this.selectedCustomer });
    }
  }

  getCustomerName(customer: Customer): string {
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || customer.phone || 'Unknown';
  }

  clearSearch(): void {
    this.searchControl.setValue('');
    this.isSearching = false;
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
