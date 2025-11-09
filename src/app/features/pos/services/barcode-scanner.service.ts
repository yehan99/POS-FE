import { Injectable } from '@angular/core';
import { Subject, Observable, fromEvent } from 'rxjs';
import { debounceTime, filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BarcodeScannerService {
  private barcodeSubject = new Subject<string>();
  private barcodeBuffer: string = '';
  private lastKeyTime: number = 0;
  private readonly BARCODE_TIMEOUT = 100; // ms between characters for barcode scanner

  public barcode$: Observable<string> = this.barcodeSubject.asObservable();

  constructor() {
    this.initKeyboardScanner();
  }

  /**
   * Initialize keyboard-based barcode scanner
   * Most USB barcode scanners act as keyboards
   */
  private initKeyboardScanner(): void {
    fromEvent<KeyboardEvent>(document, 'keydown')
      .pipe(
        filter((event) => !this.isInputFocused()),
        map((event) => this.handleKeyPress(event))
      )
      .subscribe();
  }

  /**
   * Handle keyboard input from scanner
   */
  private handleKeyPress(event: KeyboardEvent): void {
    const currentTime = Date.now();
    const timeDiff = currentTime - this.lastKeyTime;

    // If time between keys is too long, reset buffer
    if (timeDiff > this.BARCODE_TIMEOUT && this.barcodeBuffer.length > 0) {
      this.barcodeBuffer = '';
    }

    // Enter key indicates end of barcode scan
    if (event.key === 'Enter' && this.barcodeBuffer.length > 0) {
      event.preventDefault();
      this.emitBarcode(this.barcodeBuffer);
      this.barcodeBuffer = '';
      return;
    }

    // Build barcode from key presses
    if (this.isValidBarcodeChar(event.key)) {
      event.preventDefault();
      this.barcodeBuffer += event.key;
      this.lastKeyTime = currentTime;
    }
  }

  /**
   * Check if character is valid for barcode
   */
  private isValidBarcodeChar(char: string): boolean {
    return /^[a-zA-Z0-9\-_]$/.test(char);
  }

  /**
   * Check if an input field has focus
   */
  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    if (!activeElement) return false;

    const tagName = activeElement.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      activeElement.hasAttribute('contenteditable')
    );
  }

  /**
   * Emit scanned barcode
   */
  private emitBarcode(barcode: string): void {
    if (barcode && barcode.length >= 3) {
      // Minimum barcode length
      this.barcodeSubject.next(barcode);
    }
  }

  /**
   * Manually trigger barcode scan (for testing or manual input)
   */
  scanBarcode(barcode: string): void {
    this.emitBarcode(barcode);
  }

  /**
   * Initialize camera-based scanner (requires additional library)
   * This is a placeholder for future implementation with QuaggaJS
   */
  async initCameraScanner(): Promise<void> {
    // TODO: Implement with QuaggaJS or similar library
    console.warn(
      'Camera scanner not yet implemented. Install QuaggaJS for camera support.'
    );
  }

  /**
   * Stop camera scanner
   */
  stopCameraScanner(): void {
    // TODO: Implement with QuaggaJS
  }
}
