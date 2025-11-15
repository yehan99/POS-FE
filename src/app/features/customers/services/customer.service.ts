import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  Customer,
  CustomerFilter,
  CustomerStatistics,
  CustomerFormData,
  LoyaltyTier,
  PaginatedCustomers,
} from '../models/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;
  private customersSubject = new BehaviorSubject<Customer[]>([]);
  public customers$ = this.customersSubject.asObservable();

  private normalizeBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      return ['true', '1', 'yes'].includes(value.toLowerCase());
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return Boolean(value);
  }

  private parseDate(value?: string | null | Date): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return value;
    }

    const raw = `${value}`;
    const normalised = raw.includes('T') ? raw : raw.replace(' ', 'T');
    const parsed = new Date(normalised);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private mapCustomer = (customer: any): Customer => {
    const nonEmpty = (value: unknown): string | undefined => {
      if (value === null || value === undefined) return undefined;
      const str = String(value).trim();
      return str.length > 0 ? str : undefined;
    };

    // The backend sends camelCase, but handle snake_case fallback
    const data: Customer = {
      id: nonEmpty(customer.id) ?? '',
      customerCode:
        nonEmpty(customer.customerCode ?? customer.customer_code) ?? '',
      firstName: nonEmpty(customer.firstName ?? customer.first_name) ?? '',
      lastName: nonEmpty(customer.lastName ?? customer.last_name) ?? '',
      email: nonEmpty(customer.email),
      phone: nonEmpty(customer.phone) ?? '',
      dateOfBirth: this.parseDate(
        customer.dateOfBirth ?? customer.date_of_birth
      ),
      gender: customer.gender ?? undefined,
      address: customer.address ?? {
        street: undefined,
        city: undefined,
        state: undefined,
        postalCode: undefined,
        country: undefined,
      },
      loyaltyPoints: Number(customer.loyaltyPoints ?? 0),
      loyaltyTier: customer.loyaltyTier ?? 'bronze',
      totalPurchases: Number(customer.totalPurchases ?? 0),
      totalSpent: Number(customer.totalSpent ?? 0),
      lastPurchaseDate: this.parseDate(customer.lastPurchaseDate),
      notes: nonEmpty(customer.notes),
      isActive: this.normalizeBoolean(customer.isActive ?? true),
      createdAt: this.parseDate(customer.createdAt) ?? new Date(),
      updatedAt: this.parseDate(customer.updatedAt) ?? new Date(),
    };

    return data;
  };

  private mapCustomers = (customers: any[]): Customer[] =>
    customers.map((customer) => this.mapCustomer(customer));

  private mapPaginatedResponse(response: any): PaginatedCustomers {
    return {
      customers: this.mapCustomers(response.customers ?? []),
      total: Number(response.total ?? 0),
      page: Number(response.page ?? 1),
      pageSize: Number(response.pageSize ?? 10),
      totalPages: Number(response.totalPages ?? 1),
    };
  }

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

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => this.mapPaginatedResponse(response)),
      tap((response) => this.customersSubject.next(response.customers))
    );
  }

  // Get customer by ID
  getCustomerById(id: string): Observable<Customer> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        // Handle if response is wrapped in 'data' property
        const customer = response.data ?? response;
        return this.mapCustomer(customer);
      })
    );
  }

  // Search customers by phone or code (for POS quick lookup)
  searchCustomers(query: string): Observable<Customer[]> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', '1')
      .set('pageSize', '10');

    return this.http
      .get<any>(this.apiUrl, { params })
      .pipe(map((response) => this.mapCustomers(response.customers ?? [])));
  }

  // Create new customer
  createCustomer(customerData: CustomerFormData): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customerData).pipe(
      map((customer) => this.mapCustomer(customer)),
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
      map((customer) => this.mapCustomer(customer)),
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
  bulkDeleteCustomers(ids: string[]): Observable<{ deleted: number }> {
    return this.http
      .post<{ deleted: number }>(`${this.apiUrl}/bulk-delete`, { ids })
      .pipe(
        tap(() => {
          const current = this.customersSubject.value;
          this.customersSubject.next(
            current.filter((customer) => !ids.includes(customer.id))
          );
        })
      );
  }

  // Generate unique customer code
  generateCustomerCode(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/generate-code`);
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
    return this.http.get<CustomerStatistics>(`${this.apiUrl}/statistics`).pipe(
      map((stats) => ({
        ...stats,
        totalCustomers: Number(stats.totalCustomers ?? 0),
        activeCustomers: Number(stats.activeCustomers ?? 0),
        newCustomersThisMonth: Number(stats.newCustomersThisMonth ?? 0),
        totalLoyaltyPoints: Number(stats.totalLoyaltyPoints ?? 0),
        averageSpent: Number(stats.averageSpent ?? 0),
        tierDistribution: (stats.tierDistribution ?? []).map((tier) => ({
          ...tier,
          count: Number((tier as any).count ?? 0),
          percentage: Number((tier as any).percentage ?? 0),
        })),
      }))
    );
  }
}
