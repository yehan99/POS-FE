import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export interface PaymentDialogData {
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
}

export interface PaymentResult {
  paymentMethod: 'cash' | 'card' | 'mobile' | 'multiple';
  amountPaid: number;
  cashAmount?: number;
  cardAmount?: number;
  mobileAmount?: number;
  change: number;
  cardLastFour?: string;
  cardType?: string;
  mobileProvider?: string;
  mobileNumber?: string;
  reference?: string;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: false,
  templateUrl: './payment-dialog.component.html',
  styleUrl: './payment-dialog.component.scss',
})
export class PaymentDialogComponent implements OnInit {
  paymentForm: FormGroup;
  selectedMethod: 'cash' | 'card' | 'mobile' | 'multiple' = 'cash';
  cashReceived: number = 0;
  change: number = 0;

  // Quick cash amounts
  quickAmounts: number[] = [500, 1000, 2000, 5000, 10000];

  // Card types
  cardTypes = ['Visa', 'Mastercard', 'Amex', 'Other'];

  // Mobile payment providers (Sri Lankan)
  mobileProviders = ['eZ Cash', 'mCash', 'Genie', 'FriMi', 'Other'];

  constructor(
    public dialogRef: MatDialogRef<PaymentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      // Cash payment
      cashAmount: [this.data.total, [Validators.min(0)]],

      // Card payment
      cardAmount: [this.data.total, [Validators.min(0)]],
      cardType: ['Visa'],
      cardLastFour: ['', [Validators.pattern(/^\d{4}$/)]],
      cardReference: [''],

      // Mobile payment
      mobileAmount: [this.data.total, [Validators.min(0)]],
      mobileProvider: ['eZ Cash'],
      mobileNumber: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      mobileReference: [''],

      // Multiple payments
      splitCash: [0, [Validators.min(0)]],
      splitCard: [0, [Validators.min(0)]],
      splitMobile: [0, [Validators.min(0)]],
    });

    // Set default cash received to total
    this.cashReceived = this.data.total;
  }

  ngOnInit(): void {
    // Calculate change when cash amount changes
    this.paymentForm.get('cashAmount')?.valueChanges.subscribe((amount) => {
      this.cashReceived = amount || 0;
      this.calculateChange();
    });
  }

  selectMethod(method: 'cash' | 'card' | 'mobile' | 'multiple'): void {
    this.selectedMethod = method;
    this.calculateChange();
  }

  selectQuickAmount(amount: number): void {
    this.paymentForm.patchValue({ cashAmount: amount });
    this.cashReceived = amount;
    this.calculateChange();
  }

  calculateChange(): void {
    if (this.selectedMethod === 'cash') {
      this.change = Math.max(0, this.cashReceived - this.data.total);
    } else if (this.selectedMethod === 'multiple') {
      const splitCash = this.paymentForm.get('splitCash')?.value || 0;
      const splitCard = this.paymentForm.get('splitCard')?.value || 0;
      const splitMobile = this.paymentForm.get('splitMobile')?.value || 0;
      const totalPaid = splitCash + splitCard + splitMobile;
      this.change = Math.max(0, totalPaid - this.data.total);
    } else {
      this.change = 0;
    }
  }

  getTotalPaid(): number {
    if (this.selectedMethod === 'multiple') {
      const splitCash = this.paymentForm.get('splitCash')?.value || 0;
      const splitCard = this.paymentForm.get('splitCard')?.value || 0;
      const splitMobile = this.paymentForm.get('splitMobile')?.value || 0;
      return splitCash + splitCard + splitMobile;
    }
    return this.data.total;
  }

  getRemainingAmount(): number {
    if (this.selectedMethod === 'multiple') {
      return Math.max(0, this.data.total - this.getTotalPaid());
    }
    return 0;
  }

  canCompletePayment(): boolean {
    if (this.selectedMethod === 'cash') {
      return this.cashReceived >= this.data.total;
    } else if (this.selectedMethod === 'card') {
      const cardLastFour = this.paymentForm.get('cardLastFour')?.value;
      return cardLastFour && cardLastFour.length === 4;
    } else if (this.selectedMethod === 'mobile') {
      const mobileRef = this.paymentForm.get('mobileReference')?.value;
      return mobileRef && mobileRef.trim().length > 0;
    } else if (this.selectedMethod === 'multiple') {
      return this.getTotalPaid() >= this.data.total;
    }
    return false;
  }

  completePayment(): void {
    if (!this.canCompletePayment()) {
      return;
    }

    let result: PaymentResult;

    if (this.selectedMethod === 'cash') {
      result = {
        paymentMethod: 'cash',
        amountPaid: this.cashReceived,
        cashAmount: this.cashReceived,
        change: this.change,
      };
    } else if (this.selectedMethod === 'card') {
      result = {
        paymentMethod: 'card',
        amountPaid: this.data.total,
        cardAmount: this.data.total,
        cardType: this.paymentForm.get('cardType')?.value,
        cardLastFour: this.paymentForm.get('cardLastFour')?.value,
        reference: this.paymentForm.get('cardReference')?.value,
        change: 0,
      };
    } else if (this.selectedMethod === 'mobile') {
      result = {
        paymentMethod: 'mobile',
        amountPaid: this.data.total,
        mobileAmount: this.data.total,
        mobileProvider: this.paymentForm.get('mobileProvider')?.value,
        mobileNumber: this.paymentForm.get('mobileNumber')?.value,
        reference: this.paymentForm.get('mobileReference')?.value,
        change: 0,
      };
    } else {
      // Multiple payment methods
      const totalPaid = this.getTotalPaid();
      result = {
        paymentMethod: 'multiple',
        amountPaid: totalPaid,
        cashAmount: this.paymentForm.get('splitCash')?.value || 0,
        cardAmount: this.paymentForm.get('splitCard')?.value || 0,
        mobileAmount: this.paymentForm.get('splitMobile')?.value || 0,
        change: this.change,
      };
    }

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  formatCurrency(amount: number): string {
    return `LKR ${amount.toFixed(2)}`;
  }
}
