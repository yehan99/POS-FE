import { Injectable } from '@angular/core';
import { HardwareService } from './hardware.service';
import {
  PaymentTerminalConfig,
  HardwareType,
  ConnectionType,
  ConnectionStatus,
  PaymentTransaction,
  HardwareEventType,
} from '../models/hardware.model';

export interface CardDetails {
  cardType: 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER' | 'DINERS' | 'OTHER';
  last4Digits: string;
  expiryDate?: string;
  cardholderName?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  transactionId: string;
  description?: string;
  metadata?: any;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentTerminalService {
  private pendingTransactions: Map<string, PaymentTransaction> = new Map();

  constructor(private hardwareService: HardwareService) {}

  /**
   * Register a new payment terminal
   */
  registerTerminal(config: Partial<PaymentTerminalConfig>): string {
    const terminal: PaymentTerminalConfig = {
      id: this.generateId(),
      name: config.name || 'Payment Terminal',
      type: HardwareType.PAYMENT_TERMINAL,
      connectionType: config.connectionType || ConnectionType.NETWORK,
      status: ConnectionStatus.DISCONNECTED,
      enabled: true,
      terminalId: config.terminalId || '',
      merchantId: config.merchantId || '',
      supportedCards: config.supportedCards || ['VISA', 'MASTERCARD', 'AMEX'],
      supportNFC: config.supportNFC !== false,
      supportChip: config.supportChip !== false,
      supportSwipe: config.supportSwipe !== false,
      timeout: config.timeout || 60,
      ...config,
    };

    this.hardwareService.registerDevice(terminal);
    return terminal.id;
  }

  /**
   * Process card payment
   */
  async processPayment(
    terminalId: string,
    request: PaymentRequest
  ): Promise<PaymentTransaction> {
    const terminal = this.hardwareService.getDevice(
      terminalId
    ) as PaymentTerminalConfig;

    if (!terminal) {
      throw new Error('Payment terminal not found');
    }

    if (!terminal.enabled) {
      throw new Error('Payment terminal is disabled');
    }

    if (terminal.status !== ConnectionStatus.CONNECTED) {
      throw new Error('Payment terminal not connected');
    }

    // Create transaction
    const transaction: PaymentTransaction = {
      id: request.transactionId,
      amount: request.amount,
      currency: request.currency,
      status: 'PENDING',
      timestamp: new Date(),
      deviceId: terminalId,
    };

    this.pendingTransactions.set(transaction.id, transaction);

    try {
      // Send payment request to terminal
      const result = await this.sendPaymentRequest(terminal, request);

      // Update transaction with result
      Object.assign(transaction, result);
      transaction.status = 'APPROVED';

      // Emit event
      this.hardwareService.emitEvent({
        type: HardwareEventType.PAYMENT_COMPLETE,
        deviceId: terminalId,
        timestamp: new Date(),
        data: transaction,
      });

      return transaction;
    } catch (error) {
      transaction.status = 'ERROR';
      transaction.error =
        error instanceof Error ? error.message : 'Payment failed';
      throw error;
    } finally {
      this.pendingTransactions.delete(transaction.id);
    }
  }

  /**
   * Send payment request to terminal
   */
  private async sendPaymentRequest(
    terminal: PaymentTerminalConfig,
    request: PaymentRequest
  ): Promise<Partial<PaymentTransaction>> {
    // Simulate payment processing
    console.log(`Processing payment on terminal ${terminal.id}`);
    console.log(`Amount: ${request.currency} ${request.amount}`);

    // Wait for simulated processing
    await this.delay(3000);

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (success) {
      return {
        cardType: this.getRandomCardType(terminal.supportedCards),
        last4Digits: this.generateLast4Digits(),
        authCode: this.generateAuthCode(),
      };
    } else {
      throw new Error('Payment declined by card issuer');
    }
  }

  /**
   * Process NFC/contactless payment
   */
  async processNFCPayment(
    terminalId: string,
    request: PaymentRequest
  ): Promise<PaymentTransaction> {
    const terminal = this.hardwareService.getDevice(
      terminalId
    ) as PaymentTerminalConfig;

    if (!terminal) {
      throw new Error('Payment terminal not found');
    }

    if (!terminal.supportNFC) {
      throw new Error('NFC not supported on this terminal');
    }

    console.log('Waiting for NFC card/device...');
    return await this.processPayment(terminalId, request);
  }

  /**
   * Cancel pending payment
   */
  async cancelPayment(transactionId: string): Promise<void> {
    const transaction = this.pendingTransactions.get(transactionId);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = 'DECLINED';
    transaction.error = 'Cancelled by user';

    this.pendingTransactions.delete(transactionId);
  }

  /**
   * Refund payment
   */
  async refundPayment(
    terminalId: string,
    originalTransactionId: string,
    amount: number
  ): Promise<PaymentTransaction> {
    const terminal = this.hardwareService.getDevice(
      terminalId
    ) as PaymentTerminalConfig;

    if (!terminal) {
      throw new Error('Payment terminal not found');
    }

    const refund: PaymentTransaction = {
      id: `REFUND-${originalTransactionId}`,
      amount: -amount, // Negative for refund
      currency: 'LKR',
      status: 'PENDING',
      timestamp: new Date(),
      deviceId: terminalId,
    };

    try {
      // Process refund
      await this.delay(2000);

      refund.status = 'APPROVED';
      refund.authCode = this.generateAuthCode();

      return refund;
    } catch (error) {
      refund.status = 'ERROR';
      refund.error = error instanceof Error ? error.message : 'Refund failed';
      throw error;
    }
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): PaymentTransaction | undefined {
    return this.pendingTransactions.get(transactionId);
  }

  /**
   * Test terminal connection
   */
  async testTerminal(terminalId: string): Promise<boolean> {
    const terminal = this.hardwareService.getDevice(
      terminalId
    ) as PaymentTerminalConfig;

    if (!terminal) {
      throw new Error('Payment terminal not found');
    }

    try {
      this.hardwareService.updateDeviceStatus(
        terminalId,
        ConnectionStatus.CONNECTING
      );

      // Simulate connection test
      await this.delay(1500);

      const success = Math.random() > 0.2;

      if (success) {
        this.hardwareService.updateDeviceStatus(
          terminalId,
          ConnectionStatus.CONNECTED
        );
        return true;
      } else {
        this.hardwareService.updateDeviceStatus(
          terminalId,
          ConnectionStatus.ERROR,
          'Connection test failed'
        );
        return false;
      }
    } catch (error) {
      this.hardwareService.updateDeviceStatus(
        terminalId,
        ConnectionStatus.ERROR,
        'Connection error'
      );
      return false;
    }
  }

  /**
   * Get supported Sri Lankan payment gateways
   */
  getSriLankanGateways(): Array<{
    name: string;
    code: string;
    description: string;
  }> {
    return [
      {
        name: 'Commercial Bank',
        code: 'COMBANK',
        description: 'Commercial Bank POS Gateway',
      },
      {
        name: 'Sampath Bank',
        code: 'SAMPATH',
        description: 'Sampath Vishwa Payment Gateway',
      },
      {
        name: 'HNB',
        code: 'HNB',
        description: 'Hatton National Bank Payment Gateway',
      },
      {
        name: 'DFCC',
        code: 'DFCC',
        description: 'DFCC Bank Payment Gateway',
      },
      {
        name: 'Nations Trust',
        code: 'NTB',
        description: 'Nations Trust Bank Payment Gateway',
      },
      {
        name: 'PayHere',
        code: 'PAYHERE',
        description: 'PayHere Payment Gateway (Online)',
      },
      {
        name: 'iPay',
        code: 'IPAY',
        description: 'iPay Payment Gateway',
      },
      {
        name: 'LankaPay',
        code: 'LANKAPAY',
        description: 'LankaPay Common Card & Payment Switch',
      },
    ];
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber: string): boolean {
    // Remove spaces and non-digits
    const cleaned = cardNumber.replace(/\D/g, '');

    if (cleaned.length < 13 || cleaned.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect card type from number
   */
  detectCardType(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');

    if (/^4/.test(cleaned)) {
      return 'VISA';
    } else if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
      return 'MASTERCARD';
    } else if (/^3[47]/.test(cleaned)) {
      return 'AMEX';
    } else if (/^6(?:011|5)/.test(cleaned)) {
      return 'DISCOVER';
    } else if (/^3(?:0[0-5]|[68])/.test(cleaned)) {
      return 'DINERS';
    }

    return 'OTHER';
  }

  /**
   * Format card number for display
   */
  formatCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  }

  /**
   * Mask card number for security
   */
  maskCardNumber(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\D/g, '');
    if (cleaned.length < 4) return cleaned;

    const last4 = cleaned.slice(-4);
    return '**** **** **** ' + last4;
  }

  /**
   * Generate random card type
   */
  private getRandomCardType(supportedCards: string[]): string {
    return supportedCards[Math.floor(Math.random() * supportedCards.length)];
  }

  /**
   * Generate last 4 digits
   */
  private generateLast4Digits(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Generate authorization code
   */
  private generateAuthCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `terminal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get pending transactions count
   */
  getPendingTransactionsCount(): number {
    return this.pendingTransactions.size;
  }

  /**
   * Clear all pending transactions
   */
  clearPendingTransactions(): void {
    this.pendingTransactions.clear();
  }
}
