import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  Customer,
  CustomerFilter,
  CustomerStatistics,
  CustomerFormData,
  CustomerPurchaseHistory,
  LoyaltyTransaction,
  LoyaltyProgram,
  PaginatedCustomers,
} from '../models/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = '/api/customers';
  private customersSubject = new BehaviorSubject<Customer[]>([]);
  public customers$ = this.customersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get paginated and filtered customers
  getCustomers(filters: CustomerFilter = {}): Observable<PaginatedCustomers> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }
    if (filters.loyaltyTier) {
      params = params.set('loyaltyTier', filters.loyaltyTier);
    }
    if (filters.isActive !== undefined) {
      params = params.set('isActive', filters.isActive.toString());
    }
    if (filters.minTotalSpent !== undefined) {
      params = params.set('minTotalSpent', filters.minTotalSpent.toString());
    }
    if (filters.maxTotalSpent !== undefined) {
      params = params.set('maxTotalSpent', filters.maxTotalSpent.toString());
    }
    if (filters.hasEmail !== undefined) {
      params = params.set('hasEmail', filters.hasEmail.toString());
    }
    if (filters.registeredFrom) {
      params = params.set(
        'registeredFrom',
        filters.registeredFrom.toISOString()
      );
    }
    if (filters.registeredTo) {
      params = params.set('registeredTo', filters.registeredTo.toISOString());
    }
    if (filters.page !== undefined) {
      params = params.set('page', filters.page.toString());
    }
    if (filters.pageSize !== undefined) {
      params = params.set('pageSize', filters.pageSize.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<PaginatedCustomers>(this.apiUrl, { params });
  }

  // Get customer by ID
  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  // Search customers by phone or code (for POS quick lookup)
  searchCustomers(query: string): Observable<Customer[]> {
    const params = new HttpParams().set('quickSearch', query);
    return this.http.get<Customer[]>(`${this.apiUrl}/search`, { params });
  }

  // Create new customer
  createCustomer(customerData: CustomerFormData): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customerData).pipe(
      tap((customer) => {
        const current = this.customersSubject.value;
        this.customersSubject.next([...current, customer]);
      })
    );
  }

  // Update customer
  updateCustomer(
    id: string,
    customerData: Partial<CustomerFormData>
  ): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customerData).pipe(
      tap((updatedCustomer) => {
        const current = this.customersSubject.value;
        const index = current.findIndex((c) => c.id === id);
        if (index !== -1) {
          current[index] = updatedCustomer;
          this.customersSubject.next([...current]);
        }
      })
    );
  }

  // Delete customer (soft delete)
  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.customersSubject.value;
        this.customersSubject.next(current.filter((c) => c.id !== id));
      })
    );
  }

  // Bulk delete customers
  bulkDeleteCustomers(ids: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/bulk-delete`, { ids }).pipe(
      tap(() => {
        const current = this.customersSubject.value;
        this.customersSubject.next(current.filter((c) => !ids.includes(c.id)));
      })
    );
  }

  // Generate unique customer code
  generateCustomerCode(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/generate-code`);
  }

  // Get customer purchase history
  getCustomerPurchaseHistory(
    customerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Observable<{
    history: CustomerPurchaseHistory[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<any>(`${this.apiUrl}/${customerId}/purchase-history`, {
      params,
    });
  }

  // Get customer loyalty transactions
  getLoyaltyTransactions(customerId: string): Observable<LoyaltyTransaction[]> {
    return this.http.get<LoyaltyTransaction[]>(
      `${this.apiUrl}/${customerId}/loyalty-transactions`
    );
  }

  // Add loyalty points
  addLoyaltyPoints(
    customerId: string,
    points: number,
    description: string,
    transactionId?: string
  ): Observable<Customer> {
    return this.http.post<Customer>(
      `${this.apiUrl}/${customerId}/loyalty/add`,
      {
        points,
        description,
        transactionId,
      }
    );
  }

  // Redeem loyalty points
  redeemLoyaltyPoints(
    customerId: string,
    points: number,
    description: string
  ): Observable<Customer> {
    return this.http.post<Customer>(
      `${this.apiUrl}/${customerId}/loyalty/redeem`,
      {
        points,
        description,
      }
    );
  }

  // Adjust loyalty points (admin only)
  adjustLoyaltyPoints(
    customerId: string,
    points: number,
    description: string
  ): Observable<Customer> {
    return this.http.post<Customer>(
      `${this.apiUrl}/${customerId}/loyalty/adjust`,
      {
        points,
        description,
      }
    );
  }

  // Calculate loyalty tier based on total spent
  calculateLoyaltyTier(totalSpent: number): string {
    if (totalSpent >= 500000) return 'platinum'; // 500k LKR
    if (totalSpent >= 200000) return 'gold'; // 200k LKR
    if (totalSpent >= 50000) return 'silver'; // 50k LKR
    return 'bronze';
  }

  // Get customer statistics
  getCustomerStatistics(): Observable<CustomerStatistics> {
    return this.http.get<CustomerStatistics>(`${this.apiUrl}/statistics`);
  }

  // Get loyalty program settings
  getLoyaltyProgram(): Observable<LoyaltyProgram> {
    return this.http.get<LoyaltyProgram>('/api/loyalty-program');
  }

  // Update loyalty program settings
  updateLoyaltyProgram(
    program: Partial<LoyaltyProgram>
  ): Observable<LoyaltyProgram> {
    return this.http.put<LoyaltyProgram>('/api/loyalty-program', program);
  }

  // Export customers to CSV
  exportCustomers(filters: CustomerFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.loyaltyTier)
      params = params.set('loyaltyTier', filters.loyaltyTier);
    if (filters.isActive !== undefined)
      params = params.set('isActive', filters.isActive.toString());

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }

  // Import customers from CSV
  importCustomers(
    file: File
  ): Observable<{ success: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: number; errors: string[] }>(
      `${this.apiUrl}/import`,
      formData
    );
  }

  // Merge duplicate customers
  mergeCustomers(
    primaryId: string,
    secondaryIds: string[]
  ): Observable<Customer> {
    return this.http.post<Customer>(`${this.apiUrl}/merge`, {
      primaryId,
      secondaryIds,
    });
  }

  // Get customers with birthdays in current month (for marketing)
  getBirthdayCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/birthdays`);
  }

  // Send SMS or email to customer
  sendMessage(
    customerId: string,
    type: 'sms' | 'email',
    subject: string,
    message: string
  ): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${customerId}/send-message`, {
      type,
      subject,
      message,
    });
  }
}
