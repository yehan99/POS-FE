import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  CustomerService,
  Customer,
} from '../../../core/services/customer.service';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  startWith,
  map,
} from 'rxjs/operators';
import { Observable, of, BehaviorSubject, combineLatest } from 'rxjs';

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
export class CustomerDialogComponent implements OnInit {
  searchControl = new FormControl('');
  filteredCustomers$!: Observable<Customer[]>;
  allCustomers$ = new BehaviorSubject<Customer[]>([]);
  isLoading = false;
  selectedCustomer: Customer | null = null;

  constructor(
    private customerService: CustomerService,
    private dialogRef: MatDialogRef<CustomerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomerDialogData
  ) {}

  ngOnInit(): void {
    // Setup search that reacts to both search term and customer list changes
    this.filteredCustomers$ = combineLatest([
      this.searchControl.valueChanges.pipe(startWith('')),
      this.allCustomers$,
    ]).pipe(
      debounceTime(300),
      map(([searchTerm, allCustomers]) => {
        // Handle object selection from autocomplete
        if (searchTerm && typeof searchTerm === 'object') {
          return [];
        }

        const term = (searchTerm || '').toString().toLowerCase().trim();

        if (!term) {
          // Show first 20 customers when no search term
          return allCustomers.slice(0, 20);
        }

        // Search locally
        const localResults = allCustomers.filter((customer) => {
          const fullName = `${customer.firstName || ''} ${
            customer.lastName || ''
          }`.toLowerCase();
          const phone = (customer.phone || '').toLowerCase();
          const email = (customer.email || '').toLowerCase();

          return (
            fullName.includes(term) ||
            phone.includes(term) ||
            email.includes(term)
          );
        });

        return localResults.slice(0, 20);
      })
    );

    // Load all customers
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.isLoading = true;
    this.customerService.getAll(1, 100).subscribe({
      next: (response) => {
        this.allCustomers$.next(response.data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.isLoading = false;
        this.allCustomers$.next([]);
      },
    });
  }

  onCustomerSelected(event: any): void {
    this.selectedCustomer = event.option.value;
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
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim();
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
