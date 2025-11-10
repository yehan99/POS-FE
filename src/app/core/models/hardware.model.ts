// Hardware device types
export enum HardwareType {
  PRINTER = 'PRINTER',
  SCANNER = 'SCANNER',
  CASH_DRAWER = 'CASH_DRAWER',
  PAYMENT_TERMINAL = 'PAYMENT_TERMINAL',
  CUSTOMER_DISPLAY = 'CUSTOMER_DISPLAY',
  WEIGHT_SCALE = 'WEIGHT_SCALE',
}

// Hardware connection types
export enum ConnectionType {
  USB = 'USB',
  SERIAL = 'SERIAL',
  BLUETOOTH = 'BLUETOOTH',
  NETWORK = 'NETWORK',
  KEYBOARD_WEDGE = 'KEYBOARD_WEDGE',
}

// Hardware connection status
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  ERROR = 'ERROR',
}

// Printer types
export enum PrinterType {
  ESC_POS = 'ESC_POS',
  STAR = 'STAR',
  EPSON = 'EPSON',
  BROWSER_PRINT = 'BROWSER_PRINT',
}

// Barcode formats
export enum BarcodeFormat {
  EAN_13 = 'EAN_13',
  EAN_8 = 'EAN_8',
  UPC_A = 'UPC_A',
  UPC_E = 'UPC_E',
  CODE_39 = 'CODE_39',
  CODE_128 = 'CODE_128',
  ITF = 'ITF',
  QR_CODE = 'QR_CODE',
}

// Base hardware device interface
export interface HardwareDevice {
  id: string;
  name: string;
  type: HardwareType;
  connectionType: ConnectionType;
  status: ConnectionStatus;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  ipAddress?: string;
  port?: number;
  enabled: boolean;
  lastConnected?: Date;
  error?: string;
  operationsCount?: number; // Track total operations
  errorCount?: number; // Track error count
}

// Printer configuration
export interface PrinterConfig extends HardwareDevice {
  printerType: PrinterType;
  paperWidth: number; // in mm (58, 80, etc.)
  charactersPerLine: number;
  dpi: number;
  autoOpenDrawer: boolean;
  numberOfCopies: number;
  headerText?: string;
  footerText?: string;
  enableLogo: boolean;
  logoPath?: string;
}

// Scanner configuration
export interface ScannerConfig extends HardwareDevice {
  supportedFormats: BarcodeFormat[];
  autoSubmit: boolean;
  prefix?: string;
  suffix?: string;
  soundEnabled: boolean;
}

// Cash drawer configuration
export interface CashDrawerConfig extends HardwareDevice {
  openCommand: string; // ESC/POS command
  connectedToPrinter: boolean;
  printerDeviceId?: string;
  openDelay: number; // in milliseconds
}

// Payment terminal configuration
export interface PaymentTerminalConfig extends HardwareDevice {
  terminalId: string;
  merchantId: string;
  supportedCards: string[]; // VISA, MASTERCARD, AMEX, etc.
  supportNFC: boolean;
  supportChip: boolean;
  supportSwipe: boolean;
  timeout: number; // in seconds
}

// Customer display configuration
export interface CustomerDisplayConfig extends HardwareDevice {
  displayLines: number;
  charactersPerLine: number;
  welcomeMessage?: string;
  encoding: string;
}

// Weight scale configuration
export interface WeightScaleConfig extends HardwareDevice {
  unit: 'kg' | 'g' | 'lb' | 'oz';
  precision: number; // decimal places
  autoRead: boolean;
  readInterval: number; // in milliseconds
}

// Print job interface
export interface PrintJob {
  id: string;
  deviceId: string;
  content: string | Uint8Array;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

// Scan result interface
export interface ScanResult {
  code: string;
  format: BarcodeFormat;
  timestamp: Date;
  deviceId: string;
}

// Payment transaction interface
export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  cardType?: string;
  last4Digits?: string;
  authCode?: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';
  timestamp: Date;
  deviceId: string;
  error?: string;
}

// Weight reading interface
export interface WeightReading {
  weight: number;
  unit: string;
  stable: boolean;
  timestamp: Date;
  deviceId: string;
}

// Hardware event types
export enum HardwareEventType {
  DEVICE_CONNECTED = 'DEVICE_CONNECTED',
  DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED',
  DEVICE_ERROR = 'DEVICE_ERROR',
  SCAN_COMPLETE = 'SCAN_COMPLETE',
  PRINT_COMPLETE = 'PRINT_COMPLETE',
  PAYMENT_COMPLETE = 'PAYMENT_COMPLETE',
  WEIGHT_READING = 'WEIGHT_READING',
  DRAWER_OPENED = 'DRAWER_OPENED',
  DRAWER_CLOSED = 'DRAWER_CLOSED',
}

// Hardware event interface
export interface HardwareEvent {
  type: HardwareEventType;
  deviceId: string;
  timestamp: Date;
  data?: any;
  error?: string;
}
