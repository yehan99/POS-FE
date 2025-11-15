import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../services/customer.service';
import { Customer, LoyaltyTier } from '../models/customer.model';

@Component({
  selector: 'app-customer-detail',
  standalone: false,
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;

  isLoading = false;
  readonly summarySkeletonSlots = Array.from({ length: 6 });
  readonly mainSkeletonSlots = Array.from({ length: 3 });
  readonly asideSkeletonSlots = Array.from({ length: 2 });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (customerId) {
      this.loadCustomer(customerId);
    } else {
      this.router.navigate(['/customers']);
    }
  }

  loadCustomer(id: string): void {
    this.isLoading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        console.log('Loaded customer:', customer);
        this.customer = customer;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.snackBar.open('Failed to load customer', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/customers']);
      },
    });
  }

  editCustomer(): void {
    if (this.customer) {
      this.router.navigate(['/customers/edit', this.customer.id]);
    }
  }

  deleteCustomer(): void {
    if (!this.customer) return;

    if (
      confirm(
        `Are you sure you want to delete customer ${this.customer.firstName} ${this.customer.lastName}?`
      )
    ) {
      this.customerService.deleteCustomer(this.customer.id).subscribe({
        next: () => {
          this.snackBar.open('Customer deleted successfully', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.snackBar.open('Failed to delete customer', 'Close', {
            duration: 3000,
          });
        },
      });
    }
  }

  // Utility methods
  getLoyaltyTierColor(tier: LoyaltyTier): string {
    const colors = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return colors[tier];
  }

  getLoyaltyTierIcon(tier: LoyaltyTier): string {
    const icons = {
      bronze: 'looks_3',
      silver: 'looks_two',
      gold: 'looks_one',
      platinum: 'star',
    };
    return icons[tier];
  }
  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatDateShort(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getFullAddress(): string {
    if (!this.customer?.address) return 'No address provided';

    const addr = this.customer.address;
    const parts = [
      addr.street,
      addr.city,
      addr.state,
      addr.postalCode,
      addr.country,
    ].filter((p) => p);
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  }

  goBack(): void {
    this.router.navigate(['/customers']);
  }
}
