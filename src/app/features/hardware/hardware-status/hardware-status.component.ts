import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { HardwareService } from '../../../core/services/hardware.service';
import { HardwareStatusService } from '../../../core/services/hardware-status.service';
import { PrinterService } from '../../../core/services/printer.service';
import { ScannerService } from '../../../core/services/scanner.service';
import { CashDrawerService } from '../../../core/services/cash-drawer.service';
import { PaymentTerminalService } from '../../../core/services/payment-terminal.service';
import {
  HardwareDevice,
  HardwareType,
  ConnectionStatus,
  HardwareEvent,
  HardwareEventType,
} from '../../../core/models/hardware.model';

interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  type: HardwareType;
  status: ConnectionStatus;
  uptime: number; // minutes
  lastActivity?: Date;
  operationsCount: number;
  errorCount: number;
  healthScore: number; // 0-100
  responseTime?: number; // ms
}

interface SystemHealth {
  overall: number; // 0-100
  totalDevices: number;
  connectedDevices: number;
  disconnectedDevices: number;
  errorDevices: number;
  totalOperations: number;
  totalErrors: number;
  averageResponseTime: number;
  systemUptime: number; // minutes
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  device: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

@Component({
  selector: 'app-hardware-status',
  standalone: false,
  templateUrl: './hardware-status.component.html',
  styleUrl: './hardware-status.component.scss',
})
export class HardwareStatusComponent implements OnInit, OnDestroy {
  // Real-time data
  deviceHealthList: DeviceHealth[] = [];
  systemHealth: SystemHealth = {
    overall: 0,
    totalDevices: 0,
    connectedDevices: 0,
    disconnectedDevices: 0,
    errorDevices: 0,
    totalOperations: 0,
    totalErrors: 0,
    averageResponseTime: 0,
    systemUptime: 0,
  };
  recentEvents: HardwareEvent[] = [];
  alerts: Alert[] = [];

  // UI state
  selectedDevice?: DeviceHealth;
  refreshInterval = 5; // seconds
  autoRefreshEnabled = true;
  lastRefreshTime?: Date;

  // Enums for template
  HardwareType = HardwareType;
  ConnectionStatus = ConnectionStatus;

  // Subscriptions
  private subscriptions: Subscription[] = [];
  private refreshSubscription?: Subscription;
  private systemStartTime = new Date();

  constructor(
    private hardwareService: HardwareService,
    private hardwareStatusService: HardwareStatusService,
    private printerService: PrinterService,
    private scannerService: ScannerService,
    private cashDrawerService: CashDrawerService,
    private paymentTerminalService: PaymentTerminalService
  ) {}

  ngOnInit(): void {
    this.loadSystemStatus();
    this.subscribeToEvents();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadSystemStatus(): void {
    // Load complete dashboard data from backend
    this.subscriptions.push(
      this.hardwareStatusService.getDashboard().subscribe({
        next: (data) => {
          // Update system health
          this.systemHealth = {
            overall: data.system_health.overall,
            totalDevices: data.system_health.total_devices,
            connectedDevices: data.system_health.connected_devices,
            disconnectedDevices: data.system_health.disconnected_devices,
            errorDevices: data.system_health.error_devices,
            totalOperations: data.system_health.total_operations,
            totalErrors: data.system_health.total_errors,
            averageResponseTime: data.system_health.average_response_time,
            systemUptime: data.system_health.system_uptime,
          };

          // Update device health
          this.deviceHealthList = data.device_health.map((device) => ({
            deviceId: device.device_id,
            deviceName: device.device_name,
            type: device.type as HardwareType,
            status: device.status as ConnectionStatus,
            uptime: device.uptime,
            lastActivity: device.last_activity
              ? new Date(device.last_activity)
              : undefined,
            operationsCount: device.operations_count,
            errorCount: device.error_count,
            healthScore: device.health_score,
            responseTime: device.response_time ?? undefined,
          }));

          // Update alerts
          this.alerts = data.alerts.map((alert) => ({
            id: alert.id,
            type: alert.type,
            device: alert.device,
            message: alert.message,
            timestamp: new Date(alert.timestamp),
            acknowledged: alert.acknowledged,
          }));

          // Update recent events
          this.recentEvents = data.recent_events.map((event) => ({
            type: event.type as HardwareEventType,
            deviceId: event.device_id,
            timestamp: new Date(event.timestamp),
            error: event.error ?? undefined,
          }));

          this.lastRefreshTime = new Date();
        },
        error: (error) => {
          console.error('Error loading dashboard data:', error);
        },
      })
    );

    // Subscribe to real-time device updates from HardwareService
    this.subscriptions.push(
      this.hardwareService.getDevices().subscribe((devicesMap) => {
        const devices = Array.from(devicesMap.values());
        if (devices.length > 0) {
          // Refresh data when devices change
          this.refreshStatus();
        }
      })
    );
  }

  private subscribeToEvents(): void {
    // Subscribe to hardware events and refresh dashboard data
    this.subscriptions.push(
      this.hardwareService.getEvents().subscribe((event) => {
        // Refresh dashboard data from backend when events occur
        this.refreshStatus();
      })
    );
  }

  private startAutoRefresh(): void {
    if (this.autoRefreshEnabled) {
      this.refreshSubscription = interval(
        this.refreshInterval * 1000
      ).subscribe(() => {
        this.loadSystemStatus();
      });
    }
  }

  // UI Actions
  refreshStatus(): void {
    this.loadSystemStatus();
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
    } else {
      if (this.refreshSubscription) {
        this.refreshSubscription.unsubscribe();
      }
    }
  }

  selectDevice(device: DeviceHealth): void {
    this.selectedDevice = device;
  }

  acknowledgeAlert(alert: Alert): void {
    alert.acknowledged = true;
  }

  dismissAlert(alert: Alert): void {
    this.alerts = this.alerts.filter((a) => a.id !== alert.id);
  }

  clearAllAlerts(): void {
    this.alerts = [];
  }

  async testDevice(device: DeviceHealth): Promise<void> {
    try {
      const result = await this.hardwareService.testConnection(device.deviceId);
      if (result) {
        this.refreshStatus();
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  }

  getHealthColor(score: number): string {
    if (score >= 80) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  }

  getStatusColor(status: ConnectionStatus): string {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'success';
      case ConnectionStatus.DISCONNECTED:
        return 'gray';
      case ConnectionStatus.ERROR:
        return 'error';
      case ConnectionStatus.CONNECTING:
        return 'warning';
      default:
        return 'gray';
    }
  }

  getDeviceIcon(type: HardwareType): string {
    switch (type) {
      case HardwareType.PRINTER:
        return 'print';
      case HardwareType.SCANNER:
        return 'qr_code_scanner';
      case HardwareType.CASH_DRAWER:
        return 'point_of_sale';
      case HardwareType.PAYMENT_TERMINAL:
        return 'payment';
      case HardwareType.CUSTOMER_DISPLAY:
        return 'monitor';
      case HardwareType.WEIGHT_SCALE:
        return 'scale';
      default:
        return 'device_hub';
    }
  }

  formatUptime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const hrs = hours % 24;
    return `${days}d ${hrs}h`;
  }

  getEventIcon(type: HardwareEventType): string {
    switch (type) {
      case HardwareEventType.DEVICE_CONNECTED:
        return 'check_circle';
      case HardwareEventType.DEVICE_DISCONNECTED:
        return 'cancel';
      case HardwareEventType.DEVICE_ERROR:
        return 'error';
      case HardwareEventType.PRINT_COMPLETE:
        return 'print';
      case HardwareEventType.SCAN_COMPLETE:
        return 'qr_code_scanner';
      case HardwareEventType.PAYMENT_COMPLETE:
        return 'payment';
      case HardwareEventType.DRAWER_OPENED:
        return 'point_of_sale';
      default:
        return 'info';
    }
  }

  getEventColor(type: HardwareEventType): string {
    switch (type) {
      case HardwareEventType.DEVICE_CONNECTED:
      case HardwareEventType.PRINT_COMPLETE:
      case HardwareEventType.SCAN_COMPLETE:
      case HardwareEventType.PAYMENT_COMPLETE:
        return 'success';
      case HardwareEventType.DEVICE_ERROR:
      case HardwareEventType.DEVICE_DISCONNECTED:
        return 'error';
      default:
        return 'info';
    }
  }
}
