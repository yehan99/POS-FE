import { Injectable } from '@angular/core';
import { Subject, Observable, fromEvent } from 'rxjs';
import { filter, map, debounceTime } from 'rxjs/operators';
import { HardwareService } from './hardware.service';
import {
  ScannerConfig,
  HardwareType,
  ConnectionType,
  ConnectionStatus,
  ScanResult,
  BarcodeFormat,
  HardwareEventType,
} from '../models/hardware.model';

@Injectable({
  providedIn: 'root',
})
export class ScannerService {
  private scans$ = new Subject<ScanResult>();
  private keyboardBuffer: string = '';
  private keyboardTimer: any;
  private listening = false;

  constructor(private hardwareService: HardwareService) {
    this.initializeKeyboardWedge();
  }

  /**
   * Register a new scanner
   */
  registerScanner(config: Partial<ScannerConfig>): string {
    const scanner: ScannerConfig = {
      id: this.generateId(),
      name: config.name || 'Barcode Scanner',
      type: HardwareType.SCANNER,
      connectionType: config.connectionType || ConnectionType.USB,
      status: ConnectionStatus.CONNECTED,
      enabled: true,
      supportedFormats: config.supportedFormats || [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.CODE_128,
        BarcodeFormat.QR_CODE,
      ],
      autoSubmit: config.autoSubmit !== false,
      soundEnabled: config.soundEnabled !== false,
      ...config,
    };

    this.hardwareService.registerDevice(scanner).subscribe({
      next: (device) => {
        console.log('Scanner registered successfully:', device);
      },
      error: (error) => {
        console.error('Error registering scanner:', error);
      },
    });
    return scanner.id;
  }

  /**
   * Initialize keyboard wedge scanning
   * Most barcode scanners work as keyboard wedge devices
   */
  private initializeKeyboardWedge(): void {
    if (this.listening) return;

    fromEvent<KeyboardEvent>(document, 'keypress')
      .pipe(
        filter((event) => {
          // Ignore if user is typing in an input field (except designated scan inputs)
          const target = event.target as HTMLElement;
          const isInput =
            target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
          const isScanInput = target.classList.contains('scan-input');

          return !isInput || isScanInput;
        })
      )
      .subscribe((event) => {
        this.handleKeyboardInput(event);
      });

    this.listening = true;
  }

  /**
   * Handle keyboard input from scanner
   */
  private handleKeyboardInput(event: KeyboardEvent): void {
    // Clear any existing timer
    if (this.keyboardTimer) {
      clearTimeout(this.keyboardTimer);
    }

    // Enter key typically indicates end of scan
    if (event.key === 'Enter') {
      if (this.keyboardBuffer.length > 0) {
        this.processScan(this.keyboardBuffer);
        this.keyboardBuffer = '';
      }
      return;
    }

    // Add character to buffer
    this.keyboardBuffer += event.key;

    // Set timer to clear buffer if no more input (100ms timeout)
    this.keyboardTimer = setTimeout(() => {
      if (this.keyboardBuffer.length > 0) {
        this.processScan(this.keyboardBuffer);
        this.keyboardBuffer = '';
      }
    }, 100);
  }

  /**
   * Process scanned barcode
   */
  private processScan(code: string): void {
    // Clean up the code
    code = code.trim();

    if (code.length === 0) return;

    // Detect barcode format
    const format = this.detectBarcodeFormat(code);

    // Create scan result
    const result: ScanResult = {
      code,
      format,
      timestamp: new Date(),
      deviceId: 'keyboard_wedge',
    };

    // Emit scan result
    this.scans$.next(result);

    // Emit hardware event
    this.hardwareService.emitEvent({
      type: HardwareEventType.SCAN_COMPLETE,
      deviceId: 'keyboard_wedge',
      timestamp: new Date(),
      data: result,
    });

    // Play sound if enabled
    this.playScanSound();
  }

  /**
   * Detect barcode format based on code pattern
   */
  private detectBarcodeFormat(code: string): BarcodeFormat {
    // Remove any non-numeric characters for format detection
    const numericCode = code.replace(/\D/g, '');

    // EAN-13 (13 digits)
    if (numericCode.length === 13 && this.isNumeric(code)) {
      return BarcodeFormat.EAN_13;
    }

    // EAN-8 (8 digits)
    if (numericCode.length === 8 && this.isNumeric(code)) {
      return BarcodeFormat.EAN_8;
    }

    // UPC-A (12 digits)
    if (numericCode.length === 12 && this.isNumeric(code)) {
      return BarcodeFormat.UPC_A;
    }

    // UPC-E (6-8 digits)
    if (
      numericCode.length >= 6 &&
      numericCode.length <= 8 &&
      this.isNumeric(code)
    ) {
      return BarcodeFormat.UPC_E;
    }

    // CODE 39 (alphanumeric with *)
    if (code.startsWith('*') && code.endsWith('*')) {
      return BarcodeFormat.CODE_39;
    }

    // QR Code (can contain any characters, typically longer)
    if (code.length > 20) {
      return BarcodeFormat.QR_CODE;
    }

    // Default to CODE 128 (most versatile)
    return BarcodeFormat.CODE_128;
  }

  /**
   * Check if string is numeric
   */
  private isNumeric(str: string): boolean {
    return /^\d+$/.test(str);
  }

  /**
   * Play scan sound
   */
  private playScanSound(): void {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing scan sound:', error);
    }
  }

  /**
   * Get scan events stream
   */
  getScans(): Observable<ScanResult> {
    return this.scans$.asObservable();
  }

  /**
   * Manual scan (for testing or manual entry)
   */
  manualScan(code: string, deviceId: string = 'manual'): void {
    const format = this.detectBarcodeFormat(code);

    const result: ScanResult = {
      code,
      format,
      timestamp: new Date(),
      deviceId,
    };

    this.scans$.next(result);

    this.hardwareService.emitEvent({
      type: HardwareEventType.SCAN_COMPLETE,
      deviceId,
      timestamp: new Date(),
      data: result,
    });

    this.playScanSound();
  }

  /**
   * Validate barcode checksum (for EAN/UPC)
   */
  validateChecksum(code: string, format: BarcodeFormat): boolean {
    if (format === BarcodeFormat.EAN_13) {
      return this.validateEAN13(code);
    } else if (format === BarcodeFormat.EAN_8) {
      return this.validateEAN8(code);
    } else if (format === BarcodeFormat.UPC_A) {
      return this.validateUPCA(code);
    }
    return true; // Other formats don't have standard checksums
  }

  /**
   * Validate EAN-13 checksum
   */
  private validateEAN13(code: string): boolean {
    if (code.length !== 13 || !this.isNumeric(code)) return false;

    const digits = code.split('').map(Number);
    const checkDigit = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  /**
   * Validate EAN-8 checksum
   */
  private validateEAN8(code: string): boolean {
    if (code.length !== 8 || !this.isNumeric(code)) return false;

    const digits = code.split('').map(Number);
    const checkDigit = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  /**
   * Validate UPC-A checksum
   */
  private validateUPCA(code: string): boolean {
    if (code.length !== 12 || !this.isNumeric(code)) return false;

    const digits = code.split('').map(Number);
    const checkDigit = digits.pop()!;

    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  /**
   * Connect to USB scanner using Web Serial API
   */
  async connectUSBScanner(): Promise<string> {
    try {
      const port = await this.hardwareService.requestUSBDevice();

      const scannerId = this.registerScanner({
        name: 'USB Barcode Scanner',
        connectionType: ConnectionType.USB,
        status: ConnectionStatus.CONNECTED,
      });

      // Open port and listen for data
      await port.open({ baudRate: 9600 });

      // Read data from port
      const reader = port.readable.getReader();
      this.readFromUSBScanner(reader, scannerId);

      return scannerId;
    } catch (error) {
      console.error('Error connecting USB scanner:', error);
      throw error;
    }
  }

  /**
   * Read data from USB scanner
   */
  private async readFromUSBScanner(
    reader: any,
    scannerId: string
  ): Promise<void> {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Convert Uint8Array to string
        const text = new TextDecoder().decode(value);

        // Process scan
        if (text.trim().length > 0) {
          this.processScan(text.trim());
        }
      }
    } catch (error) {
      console.error('Error reading from USB scanner:', error);
      this.hardwareService.updateDeviceStatus(
        scannerId,
        ConnectionStatus.ERROR,
        'Read error'
      );
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Generate barcode (for testing/display purposes)
   */
  generateBarcode(code: string, format: BarcodeFormat): string {
    // In a real implementation, this would use a barcode generation library
    // For now, return a simple representation
    return `[${format}] ${code}`;
  }

  /**
   * Parse product information from barcode
   */
  parseProductCode(code: string, format: BarcodeFormat): any {
    // EAN-13 example: First 3 digits = country, next 4-7 = manufacturer, rest = product
    if (format === BarcodeFormat.EAN_13 && code.length === 13) {
      return {
        country: code.substring(0, 3),
        manufacturer: code.substring(3, 10),
        product: code.substring(10, 12),
        check: code.substring(12, 13),
      };
    }

    return { code };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `scanner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable/disable keyboard wedge scanning
   */
  setKeyboardWedgeEnabled(enabled: boolean): void {
    this.listening = enabled;
  }

  /**
   * Clear keyboard buffer
   */
  clearBuffer(): void {
    this.keyboardBuffer = '';
    if (this.keyboardTimer) {
      clearTimeout(this.keyboardTimer);
    }
  }
}
