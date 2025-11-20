import { Injectable } from '@angular/core';
import { Transaction } from '../models/transaction.model';

export interface ReceiptConfig {
  printerType: 'thermal' | 'a4';
  paperWidth: number; // in mm (58mm or 80mm for thermal, 210mm for A4)
  showLogo: boolean;
  logoUrl?: string;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  taxNumber?: string;
  footerMessage?: string;
  showItemCodes: boolean;
  showDiscounts: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ReceiptService {
  private defaultConfig: ReceiptConfig = {
    printerType: 'thermal',
    paperWidth: 80,
    showLogo: true,
    storeName: 'Your Store Name',
    storeAddress: '123 Main Street, Colombo, Sri Lanka',
    storePhone: '+94 11 234 5678',
    footerMessage: 'Thank you for your business!',
    showItemCodes: true,
    showDiscounts: true,
  };

  constructor() {}

  // Generate HTML receipt for printing
  generateReceiptHtml(
    transaction: Transaction,
    config?: Partial<ReceiptConfig>
  ): string {
    const receiptConfig = { ...this.defaultConfig, ...config };
    const isThermal = receiptConfig.printerType === 'thermal';
    const width = isThermal ? `${receiptConfig.paperWidth}mm` : '210mm';

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${transaction.transactionNumber}</title>
        <style>
          @media print {
            @page {
              size: ${width} auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }

          body {
            font-family: 'Courier New', monospace;
            width: ${width};
            margin: 0 auto;
            padding: ${isThermal ? '10px' : '20px'};
            font-size: ${isThermal ? '12px' : '14px'};
            line-height: 1.4;
          }

          .receipt {
            width: 100%;
          }

          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
          }

          .logo {
            max-width: 100px;
            margin: 0 auto 10px;
          }

          .store-name {
            font-size: ${isThermal ? '16px' : '20px'};
            font-weight: bold;
            margin: 5px 0;
          }

          .store-info {
            font-size: ${isThermal ? '10px' : '12px'};
            line-height: 1.3;
          }

          .transaction-info {
            margin: 10px 0;
            font-size: ${isThermal ? '11px' : '13px'};
          }

          .transaction-info div {
            margin: 3px 0;
          }

          .items {
            margin: 10px 0;
            border-top: 2px dashed #000;
            border-bottom: 2px dashed #000;
            padding: 10px 0;
          }

          .item {
            margin: 5px 0;
          }

          .item-name {
            font-weight: bold;
          }

          .item-details {
            display: flex;
            justify-content: space-between;
            margin-top: 2px;
          }

          .item-pricing-context {
            font-size: ${isThermal ? '10px' : '12px'};
            color: #555;
            margin-top: 2px;
          }

          .totals {
            margin: 10px 0;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }

          .total-row.grand-total {
            font-weight: bold;
            font-size: ${isThermal ? '14px' : '16px'};
            border-top: 2px solid #000;
            margin-top: 5px;
            padding-top: 5px;
          }

          .payment {
            margin: 10px 0;
            border-top: 2px dashed #000;
            padding-top: 10px;
          }

          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: ${isThermal ? '10px' : '12px'};
            border-top: 2px dashed #000;
            padding-top: 10px;
          }

          .bold {
            font-weight: bold;
          }

          .right {
            text-align: right;
          }

          .center {
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
    `;

    // Header
    html += `<div class="header">`;
    if (receiptConfig.showLogo && receiptConfig.logoUrl) {
      html += `<img src="${receiptConfig.logoUrl}" alt="Logo" class="logo">`;
    }
    html += `
      <div class="store-name">${receiptConfig.storeName}</div>
      <div class="store-info">
        ${receiptConfig.storeAddress}<br>
        Tel: ${receiptConfig.storePhone}
    `;
    if (receiptConfig.taxNumber) {
      html += `<br>Tax No: ${receiptConfig.taxNumber}`;
    }
    html += `
      </div>
    </div>`;

    // Transaction Info
    html += `
      <div class="transaction-info">
        <div><span class="bold">Receipt #:</span> ${
          transaction.transactionNumber
        }</div>
        <div><span class="bold">Date:</span> ${new Date(
          transaction.date
        ).toLocaleString('en-GB')}</div>
        <div><span class="bold">Cashier:</span> ${transaction.cashierName}</div>
    `;
    if (transaction.customerName) {
      html += `<div><span class="bold">Customer:</span> ${transaction.customerName}</div>`;
    }
    html += `</div>`;

    // Items
    html += `<div class="items">`;
    transaction.items.forEach((item) => {
      html += `
        <div class="item">
          <div class="item-name">${item.product.name}</div>
          <div class="item-details">
            <span>${item.quantity} x LKR ${item.unitPrice.toFixed(2)}</span>
            <span>LKR ${item.subtotal.toFixed(2)}</span>
          </div>
          <div class="item-pricing-context">
            ${
              item.pricingType === 'loyalty'
                ? 'Loyalty price applied'
                : 'Retail price'
            }
          </div>
      `;
      if (receiptConfig.showItemCodes && item.product.sku) {
        html += `<div style="font-size: 10px; color: #666;">SKU: ${item.product.sku}</div>`;
      }
      if (receiptConfig.showDiscounts && item.discountAmount > 0) {
        html += `
          <div class="item-details" style="color: #666;">
            <span>Discount (${item.discount}%)</span>
            <span>-LKR ${item.discountAmount.toFixed(2)}</span>
          </div>
        `;
      }
      html += `</div>`;
    });
    html += `</div>`;

    // Totals
    html += `
      <div class="totals">
        <div class="total-row">
          <span>Subtotal:</span>
          <span>LKR ${transaction.subtotal.toFixed(2)}</span>
        </div>
    `;

    if (transaction.discountAmount > 0) {
      const discountLabel =
        transaction.discountType === 'percentage'
          ? `Discount (${transaction.discountValue}%)`
          : 'Discount';
      html += `
        <div class="total-row">
          <span>${discountLabel}:</span>
          <span>-LKR ${transaction.discountAmount.toFixed(2)}</span>
        </div>
      `;
    }

    if (transaction.taxAmount > 0) {
      html += `
        <div class="total-row">
          <span>Tax (${transaction.taxRate}%):</span>
          <span>LKR ${transaction.taxAmount.toFixed(2)}</span>
        </div>
      `;
    }

    html += `
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>LKR ${transaction.total.toFixed(2)}</span>
        </div>
      </div>
    `;

    // Payment
    html += `
      <div class="payment">
        <div class="total-row">
          <span>Payment Method:</span>
          <span class="bold">${transaction.paymentMethod.toUpperCase()}</span>
        </div>
    `;

    if (transaction.paymentMethod === 'cash') {
      html += `
        <div class="total-row">
          <span>Cash Received:</span>
          <span>LKR ${transaction.amountPaid.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Change:</span>
          <span>LKR ${transaction.change.toFixed(2)}</span>
        </div>
      `;
    } else if (
      transaction.paymentMethod === 'card' &&
      transaction.paymentDetails.cardType
    ) {
      html += `
        <div class="total-row">
          <span>${transaction.paymentDetails.cardType}:</span>
          <span>****${transaction.paymentDetails.cardLast4}</span>
        </div>
      `;
      if (transaction.paymentDetails.cardReference) {
        html += `
          <div class="total-row">
            <span>Ref:</span>
            <span>${transaction.paymentDetails.cardReference}</span>
          </div>
        `;
      }
    } else if (
      transaction.paymentMethod === 'mobile' &&
      transaction.paymentDetails.mobileProvider
    ) {
      html += `
        <div class="total-row">
          <span>${transaction.paymentDetails.mobileProvider}:</span>
          <span>${transaction.paymentDetails.mobileNumber}</span>
        </div>
        <div class="total-row">
          <span>Ref:</span>
          <span>${transaction.paymentDetails.mobileReference}</span>
        </div>
      `;
    } else if (
      transaction.paymentMethod === 'split' &&
      transaction.paymentDetails.splitPayments
    ) {
      transaction.paymentDetails.splitPayments.forEach((split, index) => {
        html += `
          <div class="total-row">
            <span>${split.method.toUpperCase()}:</span>
            <span>LKR ${split.amount.toFixed(2)}</span>
          </div>
        `;
      });
    }

    html += `</div>`;

    // Footer
    html += `
      <div class="footer">
    `;
    if (receiptConfig.footerMessage) {
      html += `<div>${receiptConfig.footerMessage}</div>`;
    }
    html += `
        <div style="margin-top: 10px;">Powered by POS System</div>
      </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  // Print receipt
  printReceipt(
    transaction: Transaction,
    config?: Partial<ReceiptConfig>
  ): void {
    const html = this.generateReceiptHtml(transaction, config);

    // Create a hidden iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for content to load, then print
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();

        // Remove iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    }
  }

  // Download receipt as PDF (browser print dialog)
  downloadReceipt(
    transaction: Transaction,
    config?: Partial<ReceiptConfig>
  ): void {
    const html = this.generateReceiptHtml(transaction, config);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  // Get receipt data for preview
  getReceiptPreview(
    transaction: Transaction,
    config?: Partial<ReceiptConfig>
  ): string {
    return this.generateReceiptHtml(transaction, config);
  }
}
