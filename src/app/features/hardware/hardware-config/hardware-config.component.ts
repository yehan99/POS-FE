import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HardwareService } from '../../../core/services/hardware.service';
import { PrinterService } from '../../../core/services/printer.service';
import { ScannerService } from '../../../core/services/scanner.service';
import { CashDrawerService } from '../../../core/services/cash-drawer.service';
import { PaymentTerminalService } from '../../../core/services/payment-terminal.service';
import {
  HardwareDevice,
  HardwareType,
  ConnectionType,
  PrinterType,
  BarcodeFormat,
  ConnectionStatus,
  HardwareEvent,
} from '../../../core/models/hardware.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-hardware-config',
  standalone: false,
  templateUrl: './hardware-config.component.html',
  styleUrl: './hardware-config.component.scss',
})
export class HardwareConfigComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  devices: HardwareDevice[] = [];
  filteredDevices: HardwareDevice[] = [];
  selectedDevice: HardwareDevice | null = null;

  deviceTypes = Object.values(HardwareType);
  connectionTypes = Object.values(ConnectionType);
  printerTypes = Object.values(PrinterType);
  barcodeFormats = Object.values(BarcodeFormat);

  filterType: HardwareType | 'ALL' = 'ALL';
  searchQuery: string = '';

  connectionStatus = {
    total: 0,
    connected: 0,
    disconnected: 0,
    error: 0,
  };

  recentEvents: HardwareEvent[] = [];
  showEventLog: boolean = false;

  constructor(
    private hardwareService: HardwareService,
    private printerService: PrinterService,
    private scannerService: ScannerService,
    private drawerService: CashDrawerService,
    private terminalService: PaymentTerminalService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadDevices();
    this.subscribeToDeviceUpdates();
    this.subscribeToHardwareEvents();
    this.updateConnectionStatus();
    this.initializeDefaultDevices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load devices from hardware service
   */
  loadDevices(): void {
    this.hardwareService
      .getDevices()
      .pipe(takeUntil(this.destroy$))
      .subscribe((deviceMap) => {
        this.devices = Array.from(deviceMap.values());
        this.applyFilters();
        this.updateConnectionStatus();
      });
  }

  /**
   * Subscribe to device updates
   */
  subscribeToDeviceUpdates(): void {
    this.hardwareService
      .getDevices()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateConnectionStatus();
      });
  }

  /**
   * Subscribe to hardware events
   */
  subscribeToHardwareEvents(): void {
    this.hardwareService
      .getEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.recentEvents.unshift(event);
        if (this.recentEvents.length > 50) {
          this.recentEvents = this.recentEvents.slice(0, 50);
        }

        // Show notification for important events
        if (
          event.type.includes('ERROR') ||
          event.type.includes('DISCONNECTED')
        ) {
          this.showNotification(
            `Device ${event.deviceId}: ${event.type}`,
            'error'
          );
        }
      });
  }

  /**
   * Update connection status summary
   */
  updateConnectionStatus(): void {
    this.connectionStatus = this.hardwareService.getConnectionStatus();
  }

  /**
   * Apply filters to devices
   */
  applyFilters(): void {
    this.filteredDevices = this.devices.filter((device) => {
      const matchesType =
        this.filterType === 'ALL' || device.type === this.filterType;
      const matchesSearch =
        !this.searchQuery ||
        device.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        device.type.toLowerCase().includes(this.searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }

  /**
   * Initialize default devices for demo
   */
  initializeDefaultDevices(): void {
    const existingDevices = this.devices.length;

    if (existingDevices === 0) {
      // Add default printer
      this.printerService.registerPrinter({
        name: 'Receipt Printer - Epson TM-T88V',
        printerType: PrinterType.ESC_POS,
        paperWidth: 80,
        charactersPerLine: 42,
        connectionType: ConnectionType.USB,
        autoOpenDrawer: true,
      });

      // Add default scanner
      this.scannerService.registerScanner({
        name: 'Barcode Scanner - USB',
        connectionType: ConnectionType.KEYBOARD_WEDGE,
        supportedFormats: [BarcodeFormat.EAN_13, BarcodeFormat.CODE_128],
      });

      // Add default cash drawer
      this.drawerService.registerCashDrawer({
        name: 'Cash Drawer - APG',
        connectedToPrinter: true,
      });

      // Add default payment terminal
      this.terminalService.registerTerminal({
        name: 'Payment Terminal - Sampath Bank',
        terminalId: 'TERM001',
        merchantId: 'MERCH001',
        connectionType: ConnectionType.NETWORK,
      });

      this.showNotification('Default devices added successfully', 'success');
    }
  }

  /**
   * Add new device
   */
  addDevice(type: HardwareType): void {
    switch (type) {
      case HardwareType.PRINTER:
        this.addPrinter();
        break;
      case HardwareType.SCANNER:
        this.addScanner();
        break;
      case HardwareType.CASH_DRAWER:
        this.addCashDrawer();
        break;
      case HardwareType.PAYMENT_TERMINAL:
        this.addPaymentTerminal();
        break;
      default:
        this.showNotification('Device type not yet implemented', 'info');
    }
  }

  /**
   * Add printer
   */
  addPrinter(): void {
    const id = this.printerService.registerPrinter({
      name: `Printer ${
        this.devices.filter((d) => d.type === HardwareType.PRINTER).length + 1
      }`,
      printerType: PrinterType.ESC_POS,
      paperWidth: 80,
      connectionType: ConnectionType.USB,
    });
    this.showNotification('Printer added successfully', 'success');
  }

  /**
   * Add scanner
   */
  addScanner(): void {
    const id = this.scannerService.registerScanner({
      name: `Scanner ${
        this.devices.filter((d) => d.type === HardwareType.SCANNER).length + 1
      }`,
      connectionType: ConnectionType.USB,
    });
    this.showNotification('Scanner added successfully', 'success');
  }

  /**
   * Add cash drawer
   */
  addCashDrawer(): void {
    const id = this.drawerService.registerCashDrawer({
      name: `Cash Drawer ${
        this.devices.filter((d) => d.type === HardwareType.CASH_DRAWER).length +
        1
      }`,
      connectedToPrinter: true,
    });
    this.showNotification('Cash Drawer added successfully', 'success');
  }

  /**
   * Add payment terminal
   */
  addPaymentTerminal(): void {
    const id = this.terminalService.registerTerminal({
      name: `Terminal ${
        this.devices.filter((d) => d.type === HardwareType.PAYMENT_TERMINAL)
          .length + 1
      }`,
      connectionType: ConnectionType.NETWORK,
    });
    this.showNotification('Payment Terminal added successfully', 'success');
  }

  /**
   * Test device connection
   */
  async testDevice(device: HardwareDevice): Promise<void> {
    try {
      this.showNotification(`Testing ${device.name}...`, 'info');
      const success = await this.hardwareService.testConnection(device.id);

      if (success) {
        this.showNotification(
          `${device.name} connected successfully`,
          'success'
        );
      } else {
        this.showNotification(`Failed to connect to ${device.name}`, 'error');
      }
    } catch (error) {
      this.showNotification(`Error testing ${device.name}`, 'error');
    }
  }

  /**
   * Test print
   */
  async testPrint(device: HardwareDevice): Promise<void> {
    try {
      this.showNotification('Sending test print...', 'info');
      await this.printerService.testPrint(device.id);
      this.showNotification('Test print sent successfully', 'success');
    } catch (error) {
      this.showNotification('Test print failed', 'error');
    }
  }

  /**
   * Test cash drawer
   */
  async testDrawer(device: HardwareDevice): Promise<void> {
    try {
      this.showNotification('Opening cash drawer...', 'info');
      await this.drawerService.testDrawer(device.id);
      this.showNotification('Cash drawer opened successfully', 'success');
    } catch (error) {
      this.showNotification('Failed to open cash drawer', 'error');
    }
  }

  /**
   * Test payment terminal
   */
  async testTerminal(device: HardwareDevice): Promise<void> {
    try {
      this.showNotification('Testing payment terminal...', 'info');
      const success = await this.terminalService.testTerminal(device.id);

      if (success) {
        this.showNotification(
          'Payment terminal connected successfully',
          'success'
        );
      } else {
        this.showNotification('Failed to connect to payment terminal', 'error');
      }
    } catch (error) {
      this.showNotification('Payment terminal test failed', 'error');
    }
  }

  /**
   * Remove device
   */
  removeDevice(device: HardwareDevice): void {
    if (confirm(`Are you sure you want to remove ${device.name}?`)) {
      this.hardwareService.removeDevice(device.id);
      this.showNotification('Device removed successfully', 'success');

      if (this.selectedDevice?.id === device.id) {
        this.selectedDevice = null;
      }
    }
  }

  /**
   * Toggle device enabled state
   */
  toggleDevice(device: HardwareDevice): void {
    this.hardwareService.toggleDevice(device.id, !device.enabled);
    this.showNotification(
      `${device.name} ${device.enabled ? 'enabled' : 'disabled'}`,
      'success'
    );
  }

  /**
   * Select device
   */
  selectDevice(device: HardwareDevice): void {
    this.selectedDevice = device;
  }

  /**
   * Get status color
   */
  getStatusColor(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'accent';
      case ConnectionStatus.DISCONNECTED:
        return 'warn';
      case ConnectionStatus.ERROR:
        return 'warn';
      case ConnectionStatus.CONNECTING:
        return 'primary';
      default:
        return '';
    }
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'check_circle';
      case ConnectionStatus.DISCONNECTED:
        return 'cancel';
      case ConnectionStatus.ERROR:
        return 'error';
      case ConnectionStatus.CONNECTING:
        return 'sync';
      default:
        return 'help';
    }
  }

  /**
   * Get device type icon
   */
  getDeviceIcon(type: HardwareType): string {
    switch (type) {
      case HardwareType.PRINTER:
        return 'print';
      case HardwareType.SCANNER:
        return 'qr_code_scanner';
      case HardwareType.CASH_DRAWER:
        return 'point_of_sale';
      case HardwareType.PAYMENT_TERMINAL:
        return 'credit_card';
      case HardwareType.CUSTOMER_DISPLAY:
        return 'monitor';
      case HardwareType.WEIGHT_SCALE:
        return 'scale';
      default:
        return 'devices';
    }
  }

  /**
   * Show notification
   */
  showNotification(message: string, type: 'success' | 'error' | 'info'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [`snackbar-${type}`],
    });
  }

  /**
   * Clear all devices
   */
  clearAllDevices(): void {
    if (
      confirm(
        'Are you sure you want to remove all devices? This cannot be undone.'
      )
    ) {
      this.hardwareService.clearAllDevices();
      this.selectedDevice = null;
      this.showNotification('All devices cleared', 'success');
    }
  }

  /**
   * Toggle event log
   */
  toggleEventLog(): void {
    this.showEventLog = !this.showEventLog;
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.recentEvents = [];
  }

  /**
   * Format timestamp
   */
  formatTimestamp(date: Date): string {
    return new Date(date).toLocaleString();
  }
}
