import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  Transaction,
  TransactionFilter,
  TransactionSummary,
} from '../models/transaction.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Save a new transaction
  saveTransaction(transaction: Transaction): Observable<Transaction> {
    return this.http
      .post<{ success: boolean; data: Transaction; message?: string }>(
        `${environment.apiUrl}/transactions`,
        transaction
      )
      .pipe(
        map((response) => response.data),
        tap((savedTransaction) => {
          // Add to local cache
          const current = this.transactionsSubject.value;
          this.transactionsSubject.next([savedTransaction, ...current]);
        })
      );
  }

  // Get all transactions with pagination
  getTransactions(
    page: number = 1,
    limit: number = 50
  ): Observable<{ transactions: Transaction[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http
      .get<{
        success: boolean;
        data: {
          transactions: Transaction[];
          total: number;
          page: number;
          limit: number;
          total_pages: number;
        };
      }>(`${environment.apiUrl}/transactions`, { params })
      .pipe(
        map((response) => ({
          transactions: response.data.transactions,
          total: response.data.total,
        })),
        tap((response) => {
          if (page === 1) {
            this.transactionsSubject.next(response.transactions);
          }
        })
      );
  }

  // Get transactions with filters
  getFilteredTransactions(
    filter: TransactionFilter,
    page: number = 1,
    limit: number = 50
  ): Observable<{ transactions: Transaction[]; total: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    if (filter.paymentMethod) {
      params = params.set('paymentMethod', filter.paymentMethod);
    }
    if (filter.cashierId) {
      params = params.set('cashierId', filter.cashierId);
    }
    if (filter.customerId) {
      params = params.set('customerId', filter.customerId);
    }
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.minAmount) {
      params = params.set('minAmount', filter.minAmount.toString());
    }
    if (filter.maxAmount) {
      params = params.set('maxAmount', filter.maxAmount.toString());
    }
    if (filter.searchTerm) {
      params = params.set('search', filter.searchTerm);
    }

    return this.http
      .get<{
        success: boolean;
        data: { transactions: Transaction[]; total: number };
      }>(`${environment.apiUrl}/transactions/search`, { params })
      .pipe(
        map((response) => ({
          transactions: response.data.transactions,
          total: response.data.total,
        }))
      );
  }

  // Get a single transaction by ID
  getTransactionById(id: string): Observable<Transaction> {
    return this.http
      .get<{ success: boolean; data: Transaction }>(
        `${environment.apiUrl}/transactions/${id}`
      )
      .pipe(map((response) => response.data));
  }

  // Get transaction by transaction number
  getTransactionByNumber(transactionNumber: string): Observable<Transaction> {
    return this.http
      .get<{ success: boolean; data: Transaction }>(
        `${environment.apiUrl}/transactions/number/${transactionNumber}`
      )
      .pipe(map((response) => response.data));
  }

  // Get today's transactions
  getTodaysTransactions(): Observable<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getFilteredTransactions({
      startDate: today,
      endDate: tomorrow,
    }).pipe(map((response) => response.transactions));
  }

  // Get transaction summary
  getTransactionSummary(
    startDate?: Date,
    endDate?: Date
  ): Observable<TransactionSummary> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    return this.http
      .get<{ success: boolean; data: TransactionSummary }>(
        `${environment.apiUrl}/transactions/summary`,
        { params }
      )
      .pipe(map((response) => response.data));
  }

  // Refund a transaction
  refundTransaction(
    transactionId: string,
    reason: string
  ): Observable<Transaction> {
    return this.http
      .post<{ success: boolean; data: Transaction; message?: string }>(
        `${environment.apiUrl}/transactions/${transactionId}/refund`,
        { reason }
      )
      .pipe(map((response) => response.data));
  }

  // Cancel a transaction
  cancelTransaction(
    transactionId: string,
    reason: string
  ): Observable<Transaction> {
    return this.http
      .post<{ success: boolean; data: Transaction; message?: string }>(
        `${environment.apiUrl}/transactions/${transactionId}/cancel`,
        { reason }
      )
      .pipe(map((response) => response.data));
  }

  // Get cashier's transactions for a shift
  getCashierTransactions(
    cashierId: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<Transaction[]> {
    return this.getFilteredTransactions({
      cashierId,
      startDate,
      endDate,
    }).pipe(map((response) => response.transactions));
  }

  // Export transactions to CSV
  exportTransactions(filter: TransactionFilter): Observable<Blob> {
    let params = new HttpParams();

    if (filter.startDate) {
      params = params.set('startDate', filter.startDate.toISOString());
    }
    if (filter.endDate) {
      params = params.set('endDate', filter.endDate.toISOString());
    }
    // Add other filter params as needed

    return this.http.get(`${environment.apiUrl}/transactions/export`, {
      params,
      responseType: 'blob',
    });
  }
}
