import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  HardwareDevice,
  HardwareEvent,
  HardwareEventType,
  ConnectionStatus,
  HardwareType,
} from '../models/hardware.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface ConnectionStatusResponse {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
}

@Injectable({
  providedIn: 'root',
})
export class HardwareService {
  private readonly apiUrl = `${environment.apiUrl}/hardware/devices`;
  private devices$ = new BehaviorSubject<Map<string, HardwareDevice>>(
    new Map()
  );
  private events$ = new Subject<HardwareEvent>();
  private initialized = false;

  constructor(private http: HttpClient) {
    this.initializeService();
  }

  /**
   * Initialize hardware service
   */
  private initializeService(): void {
    if (this.initialized) return;

    // Load devices from backend
    this.loadDevices();

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
   * Load devices from backend
   */
  loadDevices(filters?: {
    type?: string;
    status?: string;
    enabled?: boolean;
    search?: string;
  }): Observable<HardwareDevice[]> {
    let params = new HttpParams();

    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.enabled !== undefined)
      params = params.set('enabled', filters.enabled.toString());
    if (filters?.search) params = params.set('search', filters.search);

    return this.http
      .get<ApiResponse<HardwareDevice[]>>(this.apiUrl, { params })
      .pipe(
        map((response) => response.data),
        tap((devices) => {
          const deviceMap = new Map<string, HardwareDevice>();
          devices.forEach((device) => {
            deviceMap.set(device.id, device);
          });
          this.devices$.next(deviceMap);
        }),
        catchError((error) => {
          console.error('Error loading devices:', error);
          throw error;
        })
      );
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
   * Get device by ID from backend
   */
  getDeviceById(deviceId: string): Observable<HardwareDevice> {
    return this.http
      .get<ApiResponse<HardwareDevice>>(`${this.apiUrl}/${deviceId}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Register a new device
   */
  registerDevice(
    device: Omit<HardwareDevice, 'id'>
  ): Observable<HardwareDevice> {
    return this.http
      .post<ApiResponse<HardwareDevice>>(this.apiUrl, device)
      .pipe(
        map((response) => response.data),
        tap((newDevice) => {
          const devices = this.devices$.value;
          devices.set(newDevice.id, newDevice);
          this.devices$.next(new Map(devices));

          this.emitEvent({
            type: HardwareEventType.DEVICE_CONNECTED,
            deviceId: newDevice.id,
            timestamp: new Date(),
          });
        })
      );
  }

  /**
   * Update device
   */
  updateDevice(
    deviceId: string,
    device: Partial<HardwareDevice>
  ): Observable<HardwareDevice> {
    return this.http
      .put<ApiResponse<HardwareDevice>>(`${this.apiUrl}/${deviceId}`, device)
      .pipe(
        map((response) => response.data),
        tap((updatedDevice) => {
          const devices = this.devices$.value;
          devices.set(updatedDevice.id, updatedDevice);
          this.devices$.next(new Map(devices));
        })
      );
  }

  /**
   * Update device status (local only for real-time feedback)
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
  removeDevice(deviceId: string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.apiUrl}/${deviceId}`)
      .pipe(
        map(() => undefined),
        tap(() => {
          const devices = this.devices$.value;
          devices.delete(deviceId);
          this.devices$.next(new Map(devices));
        })
      );
  }

  /**
   * Enable/disable a device
   */
  toggleDevice(deviceId: string): Observable<HardwareDevice> {
    return this.http
      .put<ApiResponse<HardwareDevice>>(`${this.apiUrl}/${deviceId}/toggle`, {})
      .pipe(
        map((response) => response.data),
        tap((updatedDevice) => {
          const devices = this.devices$.value;
          devices.set(updatedDevice.id, updatedDevice);
          this.devices$.next(new Map(devices));
        })
      );
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
    try {
      this.updateDeviceStatus(deviceId, ConnectionStatus.CONNECTING);

      const response = await this.http
        .post<ApiResponse<HardwareDevice>>(
          `${this.apiUrl}/${deviceId}/test`,
          {}
        )
        .toPromise();

      if (response?.data) {
        const device = response.data;
        this.updateDeviceStatus(deviceId, device.status, device.error);

        // Update local device data
        const devices = this.devices$.value;
        devices.set(deviceId, device);
        this.devices$.next(new Map(devices));

        return device.status === ConnectionStatus.CONNECTED;
      }

      return false;
    } catch (error) {
      console.error('Error testing connection:', error);
      this.updateDeviceStatus(
        deviceId,
        ConnectionStatus.ERROR,
        'Connection test failed'
      );
      return false;
    }
  }

  /**
   * Get connection status summary
   */
  getConnectionStatus(): Observable<ConnectionStatusResponse> {
    return this.http
      .get<ApiResponse<ConnectionStatusResponse>>(
        `${this.apiUrl}/connection-status`
      )
      .pipe(map((response) => response.data));
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
   * Clear all devices
   */
  clearAllDevices(): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/clear-all`).pipe(
      map(() => undefined),
      tap(() => {
        this.devices$.next(new Map());
      })
    );
  }

  /**
   * Bulk delete devices
   */
  bulkDeleteDevices(deviceIds: string[]): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/bulk-delete`, { ids: deviceIds })
      .pipe(
        map(() => undefined),
        tap(() => {
          const devices = this.devices$.value;
          deviceIds.forEach((id) => devices.delete(id));
          this.devices$.next(new Map(devices));
        })
      );
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
