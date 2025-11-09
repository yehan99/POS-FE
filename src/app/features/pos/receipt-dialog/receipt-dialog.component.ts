import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Transaction } from '../models/transaction.model';
import { ReceiptService, ReceiptConfig } from '../services/receipt.service';

export interface ReceiptDialogData {
  transaction: Transaction;
}

@Component({
  selector: 'app-receipt-dialog',
  standalone: false,
  templateUrl: './receipt-dialog.component.html',
  styleUrl: './receipt-dialog.component.scss',
})
export class ReceiptDialogComponent implements OnInit {
  receiptHtml: SafeHtml = '';
  printerType: 'thermal' | 'a4' = 'thermal';
  paperWidth: number = 80;
  showLogo: boolean = true;
  showItemCodes: boolean = true;
  showDiscounts: boolean = true;

  paperWidthOptions = [
    { value: 58, label: '58mm (Thermal)' },
    { value: 80, label: '80mm (Thermal)' },
    { value: 210, label: 'A4' },
  ];

  constructor(
    public dialogRef: MatDialogRef<ReceiptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReceiptDialogData,
    private receiptService: ReceiptService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.updatePreview();
  }

  updatePreview(): void {
    const config: Partial<ReceiptConfig> = {
      printerType: this.printerType,
      paperWidth: this.paperWidth,
      showLogo: this.showLogo,
      showItemCodes: this.showItemCodes,
      showDiscounts: this.showDiscounts,
      storeName: 'Paradise POS',
      storeAddress: '123 Main Street, Colombo 03, Sri Lanka',
      storePhone: '+94 11 234 5678',
      taxNumber: 'VAT-123456789',
      footerMessage: 'Thank you for shopping with us!',
    };

    const html = this.receiptService.getReceiptPreview(
      this.data.transaction,
      config
    );
    this.receiptHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  onPrinterTypeChange(): void {
    if (this.printerType === 'thermal') {
      this.paperWidth = 80;
    } else {
      this.paperWidth = 210;
    }
    this.updatePreview();
  }

  onPaperWidthChange(): void {
    this.updatePreview();
  }

  onSettingChange(): void {
    this.updatePreview();
  }

  print(): void {
    const config: Partial<ReceiptConfig> = {
      printerType: this.printerType,
      paperWidth: this.paperWidth,
      showLogo: this.showLogo,
      showItemCodes: this.showItemCodes,
      showDiscounts: this.showDiscounts,
      storeName: 'Paradise POS',
      storeAddress: '123 Main Street, Colombo 03, Sri Lanka',
      storePhone: '+94 11 234 5678',
      taxNumber: 'VAT-123456789',
      footerMessage: 'Thank you for shopping with us!',
    };

    this.receiptService.printReceipt(this.data.transaction, config);
    this.dialogRef.close('printed');
  }

  download(): void {
    const config: Partial<ReceiptConfig> = {
      printerType: this.printerType,
      paperWidth: this.paperWidth,
      showLogo: this.showLogo,
      showItemCodes: this.showItemCodes,
      showDiscounts: this.showDiscounts,
      storeName: 'Paradise POS',
      storeAddress: '123 Main Street, Colombo 03, Sri Lanka',
      storePhone: '+94 11 234 5678',
      taxNumber: 'VAT-123456789',
      footerMessage: 'Thank you for shopping with us!',
    };

    this.receiptService.downloadReceipt(this.data.transaction, config);
  }

  close(): void {
    this.dialogRef.close();
  }
}
