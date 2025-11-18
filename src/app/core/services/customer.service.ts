import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Customer {
  id?: string;
  customerCode?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
  name?: string;
  email?: string;
  address?:
    | string
    | {
        street?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
  loyaltyPoints?: number;
  loyaltyTier?: string;
  totalPurchases?: number;
  totalSpent?: number;
  lastPurchaseDate?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  /**
   * Search customers by phone number or name
   */
  searchByPhone(search: string): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${this.apiUrl}/search`, {
      params: { phone: search },
    });
  }

  /**
   * Get customer by ID
   */
  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new customer
   */
  create(customer: Partial<Customer>): Observable<Customer> {
    // Map frontend field names to API format
    const payload: any = {};

    if (customer.phone || customer.phoneNumber) {
      payload.phone = customer.phone || customer.phoneNumber;
    }

    if (customer.name) {
      // Split name into first and last name
      const nameParts = customer.name.trim().split(' ');
      payload.firstName = nameParts[0];
      payload.lastName = nameParts.slice(1).join(' ') || nameParts[0];
    } else {
      if (customer.firstName) payload.firstName = customer.firstName;
      if (customer.lastName) payload.lastName = customer.lastName;
    }

    if (customer.email) payload.email = customer.email;
    if (customer.address) payload.address = customer.address;
    if (customer.loyaltyPoints !== undefined)
      payload.loyaltyPoints = customer.loyaltyPoints;

    return this.http.post<Customer>(this.apiUrl, payload);
  }

  /**
   * Update an existing customer
   */
  update(id: number, customer: Partial<Customer>): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customer);
  }

  /**
   * Delete a customer
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get all customers (with pagination)
   */
  getAll(
    page = 1,
    limit = 50
  ): Observable<{ data: Customer[]; total: number }> {
    return this.http.get<{ data: Customer[]; total: number }>(this.apiUrl, {
      params: { page: page.toString(), limit: limit.toString() },
    });
  }
}
