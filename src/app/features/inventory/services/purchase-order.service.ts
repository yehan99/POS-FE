import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  PurchaseOrder,
  PurchaseOrderFormData,
  InventoryFilter,
  PaginatedResponse,
  GoodsReceivedNote,
} from '../models/inventory.model';

@Injectable({
  providedIn: 'root',
})
export class PurchaseOrderService {
  private apiUrl = '/api/purchase-orders';

  constructor(private http: HttpClient) {}

  // Get all purchase orders with filters
  getPurchaseOrders(
    filters: InventoryFilter = {}
  ): Observable<PaginatedResponse<PurchaseOrder>> {
    let params = new HttpParams();

    if (filters.search) params = params.set('search', filters.search);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize)
      params = params.set('pageSize', filters.pageSize.toString());
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedResponse<PurchaseOrder>>(this.apiUrl, {
      params,
    });
  }

  // Get purchase order by ID
  getPurchaseOrderById(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
  }

  // Create new purchase order
  createPurchaseOrder(po: PurchaseOrderFormData): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(this.apiUrl, po);
  }

  // Update purchase order
  updatePurchaseOrder(
    id: string,
    po: Partial<PurchaseOrderFormData>
  ): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}`, po);
  }

  // Delete purchase order
  deletePurchaseOrder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Approve purchase order
  approvePurchaseOrder(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Send purchase order to supplier
  sendPurchaseOrder(id: string, email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/send`, { email });
  }

  // Mark as ordered
  markAsOrdered(id: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/ordered`, {});
  }

  // Receive items (partial or full)
  receivePurchaseOrder(id: string, items: any[]): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/receive`, {
      items,
    });
  }

  // Cancel purchase order
  cancelPurchaseOrder(id: string, reason: string): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/cancel`, {
      reason,
    });
  }

  // Generate PO number
  generatePONumber(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/generate-number`);
  }

  // Get PO statistics
  getPOStatistics(): Observable<{
    totalPOs: number;
    pendingApproval: number;
    ordered: number;
    partiallyReceived: number;
    received: number;
    totalValue: number;
    avgDeliveryTime: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  // Get GRNs for purchase order
  getGRNsForPO(poId: string): Observable<GoodsReceivedNote[]> {
    return this.http.get<GoodsReceivedNote[]>(`${this.apiUrl}/${poId}/grns`);
  }

  // Export purchase orders to CSV
  exportPurchaseOrders(filters: InventoryFilter = {}): Observable<Blob> {
    let params = new HttpParams();
    if (filters.dateFrom)
      params = params.set('dateFrom', filters.dateFrom.toISOString());
    if (filters.dateTo)
      params = params.set('dateTo', filters.dateTo.toISOString());
    if (filters.status) params = params.set('status', filters.status);

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob',
    });
  }

  // Generate PDF for purchase order
  generatePDF(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  // Calculate PO totals
  calculateTotals(
    items: any[],
    discount: number = 0,
    shippingCost: number = 0
  ): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitCost;
      return sum + itemTotal;
    }, 0);

    const tax = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitCost;
      return sum + (itemTotal * (item.tax || 0)) / 100;
    }, 0);

    const total = subtotal + tax - discount + shippingCost;

    return { subtotal, tax, total };
  }
}
