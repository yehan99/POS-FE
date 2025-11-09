import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerService } from '../services/customer.service';
import {
  Customer,
  CustomerPurchaseHistory,
  LoyaltyTransaction,
  LoyaltyTier,
} from '../models/customer.model';

@Component({
  selector: 'app-customer-detail',
  standalone: false,
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
})
export class CustomerDetailComponent implements OnInit {
  customer: Customer | null = null;
  purchaseHistory: CustomerPurchaseHistory[] = [];
  loyaltyTransactions: LoyaltyTransaction[] = [];

  isLoading = false;
  historyPage = 1;
  historyPageSize = 10;
  historyTotal = 0;

  displayedHistoryColumns: string[] = [
    'date',
    'transactionId',
    'items',
    'total',
    'paymentMethod',
    'pointsEarned',
  ];
  displayedLoyaltyColumns: string[] = ['date', 'type', 'points', 'description'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (customerId) {
      this.loadCustomer(customerId);
      this.loadPurchaseHistory(customerId);
      this.loadLoyaltyTransactions(customerId);
    } else {
      this.router.navigate(['/customers']);
    }
  }

  loadCustomer(id: string): void {
    this.isLoading = true;
    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
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

  loadPurchaseHistory(customerId: string): void {
    this.customerService
      .getCustomerPurchaseHistory(
        customerId,
        this.historyPage,
        this.historyPageSize
      )
      .subscribe({
        next: (response) => {
          this.purchaseHistory = response.history;
          this.historyTotal = response.total;
        },
        error: (error) => {
          console.error('Error loading purchase history:', error);
        },
      });
  }

  loadLoyaltyTransactions(customerId: string): void {
    this.customerService.getLoyaltyTransactions(customerId).subscribe({
      next: (transactions) => {
        this.loyaltyTransactions = transactions;
      },
      error: (error) => {
        console.error('Error loading loyalty transactions:', error);
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

  addLoyaltyPoints(): void {
    const points = prompt('Enter points to add:');
    const description = prompt('Enter description:');

    if (points && description && this.customer) {
      this.customerService
        .addLoyaltyPoints(this.customer.id, parseInt(points), description)
        .subscribe({
          next: (updatedCustomer) => {
            this.customer = updatedCustomer;
            this.loadLoyaltyTransactions(updatedCustomer.id);
            this.snackBar.open('Loyalty points added successfully', 'Close', {
              duration: 3000,
            });
          },
          error: (error) => {
            console.error('Error adding loyalty points:', error);
            this.snackBar.open('Failed to add loyalty points', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  redeemLoyaltyPoints(): void {
    const points = prompt('Enter points to redeem:');
    const description = prompt('Enter description:');

    if (points && description && this.customer) {
      const pointsToRedeem = parseInt(points);
      if (pointsToRedeem > this.customer.loyaltyPoints) {
        this.snackBar.open('Insufficient loyalty points', 'Close', {
          duration: 3000,
        });
        return;
      }

      this.customerService
        .redeemLoyaltyPoints(this.customer.id, pointsToRedeem, description)
        .subscribe({
          next: (updatedCustomer) => {
            this.customer = updatedCustomer;
            this.loadLoyaltyTransactions(updatedCustomer.id);
            this.snackBar.open(
              'Loyalty points redeemed successfully',
              'Close',
              { duration: 3000 }
            );
          },
          error: (error) => {
            console.error('Error redeeming loyalty points:', error);
            this.snackBar.open('Failed to redeem loyalty points', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  sendMessage(): void {
    if (!this.customer) return;

    const type = confirm('Send SMS? (Cancel for Email)') ? 'sms' : 'email';
    const subject = prompt('Enter subject:');
    const message = prompt('Enter message:');

    if (subject && message) {
      this.customerService
        .sendMessage(this.customer.id, type, subject, message)
        .subscribe({
          next: () => {
            this.snackBar.open(
              `${type.toUpperCase()} sent successfully`,
              'Close',
              { duration: 3000 }
            );
          },
          error: (error) => {
            console.error(`Error sending ${type}:`, error);
            this.snackBar.open(`Failed to send ${type}`, 'Close', {
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

  getLoyaltyTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      earned: 'add_circle',
      redeemed: 'remove_circle',
      expired: 'schedule',
      adjusted: 'edit',
    };
    return icons[type] || 'info';
  }

  getLoyaltyTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      earned: '#4caf50',
      redeemed: '#f44336',
      expired: '#ff9800',
      adjusted: '#2196f3',
    };
    return colors[type] || '#757575';
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
