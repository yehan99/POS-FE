import { Injectable } from '@angular/core';
import { HardwareService } from './hardware.service';
import { PrinterService } from './printer.service';
import {
  CashDrawerConfig,
  HardwareType,
  ConnectionType,
  ConnectionStatus,
  HardwareEventType,
} from '../models/hardware.model';

@Injectable({
  providedIn: 'root',
})
export class CashDrawerService {
  private drawerStates: Map<string, boolean> = new Map(); // true = open, false = closed

  constructor(
    private hardwareService: HardwareService,
    private printerService: PrinterService
  ) {}

  /**
   * Register a new cash drawer
   */
  registerCashDrawer(config: Partial<CashDrawerConfig>): string {
    const drawer: CashDrawerConfig = {
      id: this.generateId(),
      name: config.name || 'Cash Drawer',
      type: HardwareType.CASH_DRAWER,
      connectionType: config.connectionType || ConnectionType.USB,
      status: ConnectionStatus.DISCONNECTED,
      enabled: true,
      openCommand: config.openCommand || '\x1B\x70\x00\x19\xFA', // Standard ESC/POS drawer kick
      connectedToPrinter: config.connectedToPrinter || true,
      printerDeviceId: config.printerDeviceId,
      openDelay: config.openDelay || 0,
      ...config,
    };

    this.hardwareService.registerDevice(drawer).subscribe({
      next: (device) => {
        console.log('Cash drawer registered successfully:', device);
      },
      error: (error) => {
        console.error('Error registering cash drawer:', error);
      },
    });
    this.drawerStates.set(drawer.id, false); // Initially closed
    return drawer.id;
  }

  /**
   * Open cash drawer
   */
  async openDrawer(drawerId: string, reason?: string): Promise<void> {
    const drawer = this.hardwareService.getDevice(drawerId) as CashDrawerConfig;

    if (!drawer) {
      throw new Error('Cash drawer not found');
    }

    if (!drawer.enabled) {
      throw new Error('Cash drawer is disabled');
    }

    try {
      // If connected to printer, send command through printer
      if (drawer.connectedToPrinter && drawer.printerDeviceId) {
        await this.openThroughPrinter(drawer);
      } else {
        // Send command directly to drawer
        await this.sendDrawerCommand(drawer);
      }

      // Update state
      this.drawerStates.set(drawerId, true);

      // Emit event
      this.hardwareService.emitEvent({
        type: HardwareEventType.DRAWER_OPENED,
        deviceId: drawerId,
        timestamp: new Date(),
        data: { reason },
      });

      // Auto-close state after delay (drawer doesn't report actual state)
      setTimeout(() => {
        this.drawerStates.set(drawerId, false);
        this.hardwareService.emitEvent({
          type: HardwareEventType.DRAWER_CLOSED,
          deviceId: drawerId,
          timestamp: new Date(),
        });
      }, 3000); // Assume drawer is closed after 3 seconds
    } catch (error) {
      console.error('Error opening cash drawer:', error);
      throw error;
    }
  }

  /**
   * Open drawer through connected printer
   */
  private async openThroughPrinter(drawer: CashDrawerConfig): Promise<void> {
    if (!drawer.printerDeviceId) {
      throw new Error('Printer device ID not specified');
    }

    const printer = this.hardwareService.getDevice(drawer.printerDeviceId);

    if (!printer) {
      throw new Error('Connected printer not found');
    }

    if (printer.status !== ConnectionStatus.CONNECTED) {
      throw new Error('Printer not connected');
    }

    // Apply delay if specified
    if (drawer.openDelay > 0) {
      await this.delay(drawer.openDelay);
    }

    // Send drawer open command through printer
    // In a real implementation, this would send the command to the printer
    // which would then trigger the cash drawer
    console.log(
      `Opening drawer ${drawer.id} through printer ${drawer.printerDeviceId}`
    );
    await this.delay(500); // Simulate command execution
  }

  /**
   * Send command directly to drawer
   */
  private async sendDrawerCommand(drawer: CashDrawerConfig): Promise<void> {
    // Apply delay if specified
    if (drawer.openDelay > 0) {
      await this.delay(drawer.openDelay);
    }

    // In a real implementation, send command via USB/Serial
    console.log(
      `Sending open command to drawer ${drawer.id}: ${drawer.openCommand}`
    );
    await this.delay(500); // Simulate command execution
  }

  /**
   * Check if drawer is open
   */
  isDrawerOpen(drawerId: string): boolean {
    return this.drawerStates.get(drawerId) || false;
  }

  /**
   * Get drawer state
   */
  getDrawerState(drawerId: string): 'OPEN' | 'CLOSED' | 'UNKNOWN' {
    const state = this.drawerStates.get(drawerId);
    if (state === undefined) return 'UNKNOWN';
    return state ? 'OPEN' : 'CLOSED';
  }

  /**
   * Open drawer for sale
   */
  async openForSale(
    drawerId: string,
    saleId: string,
    amount: number
  ): Promise<void> {
    await this.openDrawer(
      drawerId,
      `Sale: ${saleId}, Amount: Rs. ${amount.toFixed(2)}`
    );
  }

  /**
   * Open drawer for cash management
   */
  async openForCashManagement(
    drawerId: string,
    operation: 'ADD' | 'REMOVE',
    amount: number,
    reason: string
  ): Promise<void> {
    await this.openDrawer(
      drawerId,
      `${operation}: Rs. ${amount.toFixed(2)} - ${reason}`
    );
  }

  /**
   * Open drawer for refund
   */
  async openForRefund(
    drawerId: string,
    refundId: string,
    amount: number
  ): Promise<void> {
    await this.openDrawer(
      drawerId,
      `Refund: ${refundId}, Amount: Rs. ${amount.toFixed(2)}`
    );
  }

  /**
   * Test drawer
   */
  async testDrawer(drawerId: string): Promise<void> {
    await this.openDrawer(drawerId, 'Test');
  }

  /**
   * Get drawer open history (from events)
   */
  getDrawerHistory(drawerId: string, startDate?: Date, endDate?: Date): any[] {
    // In a real implementation, this would query stored events
    // For now, return empty array
    return [];
  }

  /**
   * Configure drawer open command
   */
  setDrawerOpenCommand(drawerId: string, command: string): void {
    const drawer = this.hardwareService.getDevice(drawerId) as CashDrawerConfig;
    if (drawer) {
      drawer.openCommand = command;
      // Update device in hardware service
      this.hardwareService.registerDevice(drawer);
    }
  }

  /**
   * Link drawer to printer
   */
  linkToPrinter(drawerId: string, printerDeviceId: string): void {
    const drawer = this.hardwareService.getDevice(drawerId) as CashDrawerConfig;
    if (drawer) {
      drawer.connectedToPrinter = true;
      drawer.printerDeviceId = printerDeviceId;
      // Update device in hardware service
      this.hardwareService.registerDevice(drawer);
    }
  }

  /**
   * Unlink drawer from printer
   */
  unlinkFromPrinter(drawerId: string): void {
    const drawer = this.hardwareService.getDevice(drawerId) as CashDrawerConfig;
    if (drawer) {
      drawer.connectedToPrinter = false;
      drawer.printerDeviceId = undefined;
      // Update device in hardware service
      this.hardwareService.registerDevice(drawer);
    }
  }

  /**
   * Get common drawer kick commands
   */
  getStandardCommands(): {
    name: string;
    command: string;
    description: string;
  }[] {
    return [
      {
        name: 'ESC/POS Standard',
        command: '\x1B\x70\x00\x19\xFA',
        description: 'Standard ESC/POS drawer kick (most common)',
      },
      {
        name: 'ESC/POS Alternative',
        command: '\x1B\x70\x00\x32\xFA',
        description: 'Alternative ESC/POS command',
      },
      {
        name: 'Star Micronics',
        command: '\x07',
        description: 'Star Micronics drawer kick',
      },
      {
        name: 'Epson',
        command: '\x1B\x70\x00',
        description: 'Epson drawer kick',
      },
    ];
  }

  /**
   * Validate drawer configuration
   */
  validateConfiguration(drawerId: string): {
    valid: boolean;
    errors: string[];
  } {
    const drawer = this.hardwareService.getDevice(drawerId) as CashDrawerConfig;
    const errors: string[] = [];

    if (!drawer) {
      errors.push('Drawer not found');
      return { valid: false, errors };
    }

    if (!drawer.openCommand || drawer.openCommand.length === 0) {
      errors.push('Open command not configured');
    }

    if (drawer.connectedToPrinter && !drawer.printerDeviceId) {
      errors.push('Printer device not specified');
    }

    if (drawer.connectedToPrinter && drawer.printerDeviceId) {
      const printer = this.hardwareService.getDevice(drawer.printerDeviceId);
      if (!printer) {
        errors.push('Connected printer not found');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `drawer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
