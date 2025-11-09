import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import {
  HardwareDevice,
  HardwareEvent,
  HardwareEventType,
  ConnectionStatus,
  HardwareType,
} from '../models/hardware.model';

@Injectable({
  providedIn: 'root',
})
export class HardwareService {
  private devices$ = new BehaviorSubject<Map<string, HardwareDevice>>(
    new Map()
  );
  private events$ = new Subject<HardwareEvent>();
  private initialized = false;

  constructor() {
    this.initializeService();
  }

  /**
   * Initialize hardware service
   */
  private initializeService(): void {
    if (this.initialized) return;

    // Load saved devices from localStorage
    this.loadDevicesFromStorage();

    // Check for Web Serial API support (for USB devices)
    if ('serial' in navigator) {
      console.log('Web Serial API supported');
    } else {
      console.warn('Web Serial API not supported');
    }

    // Check for Web Bluetooth API support
    if ('bluetooth' in navigator) {
      console.log('Web Bluetooth API supported');
    } else {
      console.warn('Web Bluetooth API not supported');
    }

    this.initialized = true;
  }

  /**
   * Get all devices
   */
  getDevices(): Observable<Map<string, HardwareDevice>> {
    return this.devices$.asObservable();
  }

  /**
   * Get devices by type
   */
  getDevicesByType(type: HardwareType): HardwareDevice[] {
    const devices = this.devices$.value;
    return Array.from(devices.values()).filter(
      (device) => device.type === type
    );
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): HardwareDevice | undefined {
    return this.devices$.value.get(deviceId);
  }

  /**
   * Register a new device
   */
  registerDevice(device: HardwareDevice): void {
    const devices = this.devices$.value;
    devices.set(device.id, device);
    this.devices$.next(new Map(devices));
    this.saveDevicesToStorage();

    this.emitEvent({
      type: HardwareEventType.DEVICE_CONNECTED,
      deviceId: device.id,
      timestamp: new Date(),
    });
  }

  /**
   * Update device status
   */
  updateDeviceStatus(
    deviceId: string,
    status: ConnectionStatus,
    error?: string
  ): void {
    const devices = this.devices$.value;
    const device = devices.get(deviceId);

    if (device) {
      device.status = status;
      device.error = error;
      if (status === ConnectionStatus.CONNECTED) {
        device.lastConnected = new Date();
      }
      devices.set(deviceId, device);
      this.devices$.next(new Map(devices));
      this.saveDevicesToStorage();

      if (status === ConnectionStatus.DISCONNECTED) {
        this.emitEvent({
          type: HardwareEventType.DEVICE_DISCONNECTED,
          deviceId,
          timestamp: new Date(),
        });
      } else if (status === ConnectionStatus.ERROR) {
        this.emitEvent({
          type: HardwareEventType.DEVICE_ERROR,
          deviceId,
          timestamp: new Date(),
          error,
        });
      }
    }
  }

  /**
   * Remove a device
   */
  removeDevice(deviceId: string): void {
    const devices = this.devices$.value;
    devices.delete(deviceId);
    this.devices$.next(new Map(devices));
    this.saveDevicesToStorage();
  }

  /**
   * Enable/disable a device
   */
  toggleDevice(deviceId: string, enabled: boolean): void {
    const devices = this.devices$.value;
    const device = devices.get(deviceId);

    if (device) {
      device.enabled = enabled;
      devices.set(deviceId, device);
      this.devices$.next(new Map(devices));
      this.saveDevicesToStorage();
    }
  }

  /**
   * Get hardware events stream
   */
  getEvents(): Observable<HardwareEvent> {
    return this.events$.asObservable();
  }

  /**
   * Emit a hardware event
   */
  emitEvent(event: HardwareEvent): void {
    this.events$.next(event);
  }

  /**
   * Test device connection
   */
  async testConnection(deviceId: string): Promise<boolean> {
    const device = this.getDevice(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    try {
      this.updateDeviceStatus(deviceId, ConnectionStatus.CONNECTING);

      // Simulate connection test (in real implementation, this would test actual hardware)
      await this.delay(1000);

      const success = Math.random() > 0.2; // 80% success rate for demo

      if (success) {
        this.updateDeviceStatus(deviceId, ConnectionStatus.CONNECTED);
        return true;
      } else {
        this.updateDeviceStatus(
          deviceId,
          ConnectionStatus.ERROR,
          'Connection test failed'
        );
        return false;
      }
    } catch (error) {
      this.updateDeviceStatus(
        deviceId,
        ConnectionStatus.ERROR,
        'Connection error'
      );
      return false;
    }
  }

  /**
   * Get connection status summary
   */
  getConnectionStatus(): {
    total: number;
    connected: number;
    disconnected: number;
    error: number;
  } {
    const devices = Array.from(this.devices$.value.values());
    return {
      total: devices.length,
      connected: devices.filter((d) => d.status === ConnectionStatus.CONNECTED)
        .length,
      disconnected: devices.filter(
        (d) => d.status === ConnectionStatus.DISCONNECTED
      ).length,
      error: devices.filter((d) => d.status === ConnectionStatus.ERROR).length,
    };
  }

  /**
   * Check if Web Serial API is supported
   */
  isWebSerialSupported(): boolean {
    return 'serial' in navigator;
  }

  /**
   * Check if Web Bluetooth API is supported
   */
  isWebBluetoothSupported(): boolean {
    return 'bluetooth' in navigator;
  }

  /**
   * Request USB device access (Web Serial API)
   */
  async requestUSBDevice(): Promise<any> {
    if (!this.isWebSerialSupported()) {
      throw new Error('Web Serial API not supported');
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      return port;
    } catch (error) {
      console.error('Error requesting USB device:', error);
      throw error;
    }
  }

  /**
   * Request Bluetooth device access
   */
  async requestBluetoothDevice(): Promise<any> {
    if (!this.isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth API not supported');
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'],
      });
      return device;
    } catch (error) {
      console.error('Error requesting Bluetooth device:', error);
      throw error;
    }
  }

  /**
   * Save devices to localStorage
   */
  private saveDevicesToStorage(): void {
    try {
      const devices = Array.from(this.devices$.value.values());
      localStorage.setItem('hardware_devices', JSON.stringify(devices));
    } catch (error) {
      console.error('Error saving devices to storage:', error);
    }
  }

  /**
   * Load devices from localStorage
   */
  private loadDevicesFromStorage(): void {
    try {
      const stored = localStorage.getItem('hardware_devices');
      if (stored) {
        const devices = JSON.parse(stored) as HardwareDevice[];
        const deviceMap = new Map<string, HardwareDevice>();
        devices.forEach((device) => {
          // Set all devices as disconnected on startup
          device.status = ConnectionStatus.DISCONNECTED;
          deviceMap.set(device.id, device);
        });
        this.devices$.next(deviceMap);
      }
    } catch (error) {
      console.error('Error loading devices from storage:', error);
    }
  }

  /**
   * Clear all devices
   */
  clearAllDevices(): void {
    this.devices$.next(new Map());
    localStorage.removeItem('hardware_devices');
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
