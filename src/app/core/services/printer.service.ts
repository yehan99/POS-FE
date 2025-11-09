import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { HardwareService } from './hardware.service';
import {
  PrinterConfig,
  PrinterType,
  HardwareType,
  ConnectionType,
  ConnectionStatus,
  PrintJob,
  HardwareEventType,
} from '../models/hardware.model';

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';

interface ReceiptData {
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  taxNumber?: string;
  receiptNumber: string;
  date: string;
  cashier?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  payment?: {
    method: string;
    amount: number;
    change?: number;
  };
  footer?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PrinterService {
  private printQueue: Map<string, PrintJob[]> = new Map();

  constructor(private hardwareService: HardwareService) {}

  /**
   * Register a new printer
   */
  registerPrinter(config: Partial<PrinterConfig>): string {
    const printer: PrinterConfig = {
      id: this.generateId(),
      name: config.name || 'Receipt Printer',
      type: HardwareType.PRINTER,
      connectionType: config.connectionType || ConnectionType.USB,
      status: ConnectionStatus.DISCONNECTED,
      enabled: true,
      printerType: config.printerType || PrinterType.ESC_POS,
      paperWidth: config.paperWidth || 80,
      charactersPerLine: config.charactersPerLine || 42,
      dpi: config.dpi || 203,
      autoOpenDrawer: config.autoOpenDrawer || false,
      numberOfCopies: config.numberOfCopies || 1,
      enableLogo: config.enableLogo || false,
      ...config,
    };

    this.hardwareService.registerDevice(printer);
    return printer.id;
  }

  /**
   * Print receipt
   */
  async printReceipt(
    deviceId: string,
    receiptData: ReceiptData
  ): Promise<void> {
    const printer = this.hardwareService.getDevice(deviceId) as PrinterConfig;

    if (!printer) {
      throw new Error('Printer not found');
    }

    if (!printer.enabled) {
      throw new Error('Printer is disabled');
    }

    if (printer.status !== ConnectionStatus.CONNECTED) {
      // Try to connect
      const connected = await this.hardwareService.testConnection(deviceId);
      if (!connected) {
        throw new Error('Printer not connected');
      }
    }

    try {
      // Generate print content based on printer type
      let content: string;

      switch (printer.printerType) {
        case PrinterType.ESC_POS:
          content = this.generateESCPOSReceipt(receiptData, printer);
          break;
        case PrinterType.STAR:
          content = this.generateStarReceipt(receiptData, printer);
          break;
        case PrinterType.BROWSER_PRINT:
          await this.printBrowser(receiptData, printer);
          return;
        default:
          content = this.generateESCPOSReceipt(receiptData, printer);
      }

      // Create print job
      const job: PrintJob = {
        id: this.generateId(),
        deviceId,
        content,
        status: 'PENDING',
        createdAt: new Date(),
      };

      // Add to queue
      this.addToQueue(deviceId, job);

      // Process queue
      await this.processQueue(deviceId);

      // Emit print complete event
      this.hardwareService.emitEvent({
        type: HardwareEventType.PRINT_COMPLETE,
        deviceId,
        timestamp: new Date(),
        data: { jobId: job.id },
      });
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  }

  /**
   * Generate ESC/POS receipt content
   */
  private generateESCPOSReceipt(
    data: ReceiptData,
    printer: PrinterConfig
  ): string {
    let receipt = '';

    // Initialize printer
    receipt += ESC + '@'; // Initialize

    // Center alignment for header
    receipt += ESC + 'a' + '\x01';

    // Print logo if enabled
    if (printer.enableLogo && printer.logoPath) {
      // Logo printing would require image processing
      // Placeholder for logo
    }

    // Business name - bold and larger
    if (data.businessName) {
      receipt += ESC + 'E' + '\x01'; // Bold on
      receipt += GS + '!' + '\x11'; // Double height and width
      receipt += data.businessName + '\n';
      receipt += GS + '!' + '\x00'; // Normal size
      receipt += ESC + 'E' + '\x00'; // Bold off
    }

    // Business details
    if (data.businessAddress) {
      receipt += data.businessAddress + '\n';
    }
    if (data.businessPhone) {
      receipt += 'Tel: ' + data.businessPhone + '\n';
    }
    if (data.taxNumber) {
      receipt += 'VAT: ' + data.taxNumber + '\n';
    }

    receipt += this.printLine(printer.charactersPerLine, '-') + '\n';

    // Left alignment for receipt details
    receipt += ESC + 'a' + '\x00';

    // Receipt info
    receipt += `Receipt: ${data.receiptNumber}\n`;
    receipt += `Date: ${data.date}\n`;
    if (data.cashier) {
      receipt += `Cashier: ${data.cashier}\n`;
    }

    receipt += this.printLine(printer.charactersPerLine, '-') + '\n';

    // Items
    for (const item of data.items) {
      const itemLine = this.formatItemLine(
        item.name,
        item.quantity,
        item.price,
        item.total,
        printer.charactersPerLine
      );
      receipt += itemLine + '\n';
    }

    receipt += this.printLine(printer.charactersPerLine, '-') + '\n';

    // Totals - right aligned
    receipt += ESC + 'a' + '\x02'; // Right align

    receipt += this.formatTotal('Subtotal:', data.subtotal) + '\n';

    if (data.discount) {
      receipt += this.formatTotal('Discount:', data.discount) + '\n';
    }

    if (data.tax) {
      receipt += this.formatTotal('Tax:', data.tax) + '\n';
    }

    // Grand total - bold
    receipt += ESC + 'E' + '\x01'; // Bold on
    receipt += GS + '!' + '\x11'; // Double size
    receipt += this.formatTotal('TOTAL:', data.total) + '\n';
    receipt += GS + '!' + '\x00'; // Normal size
    receipt += ESC + 'E' + '\x00'; // Bold off

    // Payment info
    if (data.payment) {
      receipt += this.printLine(printer.charactersPerLine, '-') + '\n';
      receipt +=
        this.formatTotal(data.payment.method + ':', data.payment.amount) + '\n';
      if (data.payment.change) {
        receipt += this.formatTotal('Change:', data.payment.change) + '\n';
      }
    }

    // Center alignment for footer
    receipt += ESC + 'a' + '\x01';
    receipt += this.printLine(printer.charactersPerLine, '-') + '\n';

    if (data.footer) {
      receipt += data.footer + '\n';
    }

    receipt += 'Thank you for your business!\n';
    receipt += 'Please come again\n\n';

    // QR code (optional - would require data)
    // receipt += this.generateQRCode(data.receiptNumber);

    // Cut paper
    receipt += GS + 'V' + '\x00'; // Full cut

    // Open cash drawer if configured
    if (printer.autoOpenDrawer) {
      receipt += this.getDrawerOpenCommand();
    }

    return receipt;
  }

  /**
   * Generate Star printer receipt content
   */
  private generateStarReceipt(
    data: ReceiptData,
    printer: PrinterConfig
  ): string {
    // Star printer commands are similar but with some differences
    // This is a simplified version
    return this.generateESCPOSReceipt(data, printer);
  }

  /**
   * Print using browser print dialog
   */
  private async printBrowser(
    data: ReceiptData,
    printer: PrinterConfig
  ): Promise<void> {
    const printWindow = window.open('', '_blank', 'width=300,height=600');

    if (!printWindow) {
      throw new Error('Unable to open print window');
    }

    const html = this.generateHTMLReceipt(data, printer);
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load
    await new Promise((resolve) => setTimeout(resolve, 500));

    printWindow.print();
    printWindow.close();
  }

  /**
   * Generate HTML receipt for browser printing
   */
  private generateHTMLReceipt(
    data: ReceiptData,
    printer: PrinterConfig
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: ${printer.paperWidth}mm;
            margin: 0;
            padding: 10mm;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .large { font-size: 18px; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .item { display: flex; justify-content: space-between; }
          .total { text-align: right; }
          @media print {
            body { width: ${printer.paperWidth}mm; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          ${
            data.businessName
              ? `<div class="bold large">${data.businessName}</div>`
              : ''
          }
          ${data.businessAddress ? `<div>${data.businessAddress}</div>` : ''}
          ${data.businessPhone ? `<div>Tel: ${data.businessPhone}</div>` : ''}
          ${data.taxNumber ? `<div>VAT: ${data.taxNumber}</div>` : ''}
        </div>
        <div class="line"></div>
        <div>Receipt: ${data.receiptNumber}</div>
        <div>Date: ${data.date}</div>
        ${data.cashier ? `<div>Cashier: ${data.cashier}</div>` : ''}
        <div class="line"></div>
        ${data.items
          .map(
            (item) => `
          <div class="item">
            <span>${item.name} x${item.quantity}</span>
            <span>${this.formatCurrency(item.total)}</span>
          </div>
        `
          )
          .join('')}
        <div class="line"></div>
        <div class="total">Subtotal: ${this.formatCurrency(data.subtotal)}</div>
        ${
          data.discount
            ? `<div class="total">Discount: ${this.formatCurrency(
                data.discount
              )}</div>`
            : ''
        }
        ${
          data.tax
            ? `<div class="total">Tax: ${this.formatCurrency(data.tax)}</div>`
            : ''
        }
        <div class="total bold large">TOTAL: ${this.formatCurrency(
          data.total
        )}</div>
        ${
          data.payment
            ? `
          <div class="line"></div>
          <div class="total">${data.payment.method}: ${this.formatCurrency(
                data.payment.amount
              )}</div>
          ${
            data.payment.change
              ? `<div class="total">Change: ${this.formatCurrency(
                  data.payment.change
                )}</div>`
              : ''
          }
        `
            : ''
        }
        <div class="line"></div>
        <div class="center">
          ${data.footer || ''}
          <div>Thank you for your business!</div>
          <div>Please come again</div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Test print
   */
  async testPrint(deviceId: string): Promise<void> {
    const testReceipt: ReceiptData = {
      businessName: 'Paradise POS Test',
      receiptNumber: 'TEST-001',
      date: new Date().toLocaleString(),
      items: [
        { name: 'Test Item 1', quantity: 1, price: 100, total: 100 },
        { name: 'Test Item 2', quantity: 2, price: 50, total: 100 },
      ],
      subtotal: 200,
      tax: 0,
      total: 200,
      footer: 'This is a test print',
    };

    await this.printReceipt(deviceId, testReceipt);
  }

  /**
   * Get cash drawer open command
   */
  private getDrawerOpenCommand(): string {
    // Standard ESC/POS drawer kick command
    return ESC + 'p' + '\x00' + '\x19' + '\xFA';
  }

  /**
   * Format item line
   */
  private formatItemLine(
    name: string,
    qty: number,
    price: number,
    total: number,
    width: number
  ): string {
    const qtyStr = `x${qty}`;
    const totalStr = this.formatCurrency(total);
    const maxNameLength = width - qtyStr.length - totalStr.length - 2;

    const truncatedName =
      name.length > maxNameLength
        ? name.substring(0, maxNameLength - 3) + '...'
        : name;
    const padding =
      width - truncatedName.length - qtyStr.length - totalStr.length;

    return truncatedName + qtyStr + ' '.repeat(padding) + totalStr;
  }

  /**
   * Format total line
   */
  private formatTotal(label: string, amount: number): string {
    return `${label} ${this.formatCurrency(amount)}`;
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return `Rs. ${amount.toFixed(2)}`;
  }

  /**
   * Print line of characters
   */
  private printLine(width: number, char: string = '-'): string {
    return char.repeat(width);
  }

  /**
   * Add job to queue
   */
  private addToQueue(deviceId: string, job: PrintJob): void {
    if (!this.printQueue.has(deviceId)) {
      this.printQueue.set(deviceId, []);
    }
    this.printQueue.get(deviceId)!.push(job);
  }

  /**
   * Process print queue
   */
  private async processQueue(deviceId: string): Promise<void> {
    const queue = this.printQueue.get(deviceId);
    if (!queue || queue.length === 0) return;

    const job = queue[0];

    try {
      job.status = 'PRINTING';

      // Simulate printing (in real implementation, send to actual printer)
      await this.sendToPrinter(deviceId, job.content);

      job.status = 'COMPLETED';
      job.completedAt = new Date();

      // Remove from queue
      queue.shift();

      // Process next job
      if (queue.length > 0) {
        await this.processQueue(deviceId);
      }
    } catch (error) {
      job.status = 'FAILED';
      job.error = error instanceof Error ? error.message : 'Print failed';
      throw error;
    }
  }

  /**
   * Send content to printer
   */
  private async sendToPrinter(
    deviceId: string,
    content: string | Uint8Array
  ): Promise<void> {
    // In a real implementation, this would send data to the printer via:
    // - Web Serial API for USB printers
    // - WebSocket to a local print server
    // - Network request to a network printer

    // For now, simulate printing with a delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log('Printing to device:', deviceId);
    console.log('Content length:', content.length);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get print queue status
   */
  getQueueStatus(deviceId: string): PrintJob[] {
    return this.printQueue.get(deviceId) || [];
  }

  /**
   * Clear print queue
   */
  clearQueue(deviceId: string): void {
    this.printQueue.delete(deviceId);
  }
}
