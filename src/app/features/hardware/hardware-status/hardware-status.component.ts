import { Component, OnInit, OnDestroy } from '@angular/core';
import { interval, Subscription } from 'rxjs';
import { HardwareService } from '../../../core/services/hardware.service';
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
    // Subscribe to devices observable
    this.subscriptions.push(
      this.hardwareService.getDevices().subscribe((devicesMap) => {
        const devices = Array.from(devicesMap.values());

        // Calculate device health
        this.deviceHealthList = devices.map((device) =>
          this.calculateDeviceHealth(device)
        );

        // Calculate system health
        this.calculateSystemHealth();

        // Generate alerts
        this.generateAlerts();

        this.lastRefreshTime = new Date();
      })
    );

    // Load recent events
    this.loadRecentEvents();
  }

  private calculateDeviceHealth(device: HardwareDevice): DeviceHealth {
    const now = new Date();
    const uptime = device.lastConnected
      ? Math.floor((now.getTime() - device.lastConnected.getTime()) / 60000)
      : 0;

    // Calculate health score (0-100)
    let healthScore = 100;
    if (device.status === ConnectionStatus.DISCONNECTED) healthScore = 0;
    else if (device.status === ConnectionStatus.ERROR) healthScore = 20;
    else if (device.status === ConnectionStatus.CONNECTING) healthScore = 50;

    // Adjust based on errors
    if (device.errorCount && device.errorCount > 0) {
      healthScore -= Math.min(device.errorCount * 5, 30);
    }

    // Simulate response time (in real implementation, track actual response times)
    const responseTime =
      device.status === ConnectionStatus.CONNECTED
        ? Math.floor(Math.random() * 50) + 10
        : undefined;

    return {
      deviceId: device.id,
      deviceName: device.name,
      type: device.type,
      status: device.status,
      uptime,
      lastActivity: device.lastConnected,
      operationsCount: device.operationsCount || 0,
      errorCount: device.errorCount || 0,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      responseTime,
    };
  }

  private calculateSystemHealth(): void {
    const connected = this.deviceHealthList.filter(
      (d) => d.status === ConnectionStatus.CONNECTED
    ).length;
    const disconnected = this.deviceHealthList.filter(
      (d) => d.status === ConnectionStatus.DISCONNECTED
    ).length;
    const error = this.deviceHealthList.filter(
      (d) => d.status === ConnectionStatus.ERROR
    ).length;

    const totalOperations = this.deviceHealthList.reduce(
      (sum, d) => sum + d.operationsCount,
      0
    );
    const totalErrors = this.deviceHealthList.reduce(
      (sum, d) => sum + d.errorCount,
      0
    );

    const responseTimes = this.deviceHealthList
      .filter((d) => d.responseTime)
      .map((d) => d.responseTime!);
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length
        : 0;

    // Calculate overall health score
    let overallHealth = 100;
    if (this.deviceHealthList.length > 0) {
      const connectedRatio = connected / this.deviceHealthList.length;
      const errorRatio = error / this.deviceHealthList.length;
      overallHealth = Math.floor(
        connectedRatio * 100 - errorRatio * 50 - Math.min(totalErrors * 2, 30)
      );
    }

    const systemUptime = Math.floor(
      (new Date().getTime() - this.systemStartTime.getTime()) / 60000
    );

    this.systemHealth = {
      overall: Math.max(0, Math.min(100, overallHealth)),
      totalDevices: this.deviceHealthList.length,
      connectedDevices: connected,
      disconnectedDevices: disconnected,
      errorDevices: error,
      totalOperations,
      totalErrors,
      averageResponseTime: Math.round(avgResponseTime),
      systemUptime,
    };
  }

  private loadRecentEvents(): void {
    // Get last 30 events
    const allEvents: HardwareEvent[] = [];
    this.subscriptions.push(
      this.hardwareService.getEvents().subscribe((event) => {
        allEvents.unshift(event);
        if (allEvents.length > 30) allEvents.pop();
        this.recentEvents = [...allEvents];
      })
    );
  }

  private generateAlerts(): void {
    const newAlerts: Alert[] = [];

    // Check for disconnected devices
    this.deviceHealthList
      .filter((d) => d.status === ConnectionStatus.DISCONNECTED)
      .forEach((device) => {
        newAlerts.push({
          id: `alert-${device.deviceId}-disconnected`,
          type: 'warning',
          device: device.deviceName,
          message: `Device disconnected`,
          timestamp: new Date(),
          acknowledged: false,
        });
      });

    // Check for error devices
    this.deviceHealthList
      .filter((d) => d.status === ConnectionStatus.ERROR)
      .forEach((device) => {
        newAlerts.push({
          id: `alert-${device.deviceId}-error`,
          type: 'error',
          device: device.deviceName,
          message: `Device error - check connection`,
          timestamp: new Date(),
          acknowledged: false,
        });
      });

    // Check for low health scores
    this.deviceHealthList
      .filter(
        (d) => d.healthScore < 50 && d.status === ConnectionStatus.CONNECTED
      )
      .forEach((device) => {
        newAlerts.push({
          id: `alert-${device.deviceId}-health`,
          type: 'warning',
          device: device.deviceName,
          message: `Low health score: ${device.healthScore}%`,
          timestamp: new Date(),
          acknowledged: false,
        });
      });

    // Check for high error count
    this.deviceHealthList
      .filter((d) => d.errorCount > 5)
      .forEach((device) => {
        newAlerts.push({
          id: `alert-${device.deviceId}-errors`,
          type: 'error',
          device: device.deviceName,
          message: `High error count: ${device.errorCount} errors`,
          timestamp: new Date(),
          acknowledged: false,
        });
      });

    // Merge with existing alerts (keep acknowledged ones)
    this.alerts = [
      ...newAlerts,
      ...this.alerts.filter((a) => a.acknowledged),
    ].slice(0, 50);
  }

  private subscribeToEvents(): void {
    // Subscribe to hardware events
    this.subscriptions.push(
      this.hardwareService.getEvents().subscribe((event) => {
        // Update device operations count
        const device = this.deviceHealthList.find(
          (d) => d.deviceId === event.deviceId
        );
        if (device) {
          device.operationsCount++;
          device.lastActivity = event.timestamp;

          if (event.type === HardwareEventType.DEVICE_ERROR) {
            device.errorCount++;
          }
        }

        // Recalculate health
        this.calculateSystemHealth();
        this.generateAlerts();
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
        this.generateAlerts();
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
    this.loadSystemStatus();
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
