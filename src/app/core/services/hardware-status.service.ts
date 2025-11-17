import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface SystemHealth {
  overall: number;
  total_devices: number;
  connected_devices: number;
  disconnected_devices: number;
  error_devices: number;
  total_operations: number;
  total_errors: number;
  average_response_time: number;
  system_uptime: number;
}

export interface DeviceHealth {
  device_id: string;
  device_name: string;
  type: string;
  status: string;
  uptime: number;
  last_activity: string | null;
  operations_count: number;
  error_count: number;
  health_score: number;
  response_time: number | null;
}

export interface DeviceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  device: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface DeviceEvent {
  type: string;
  device_id: string;
  device_name: string;
  timestamp: string;
  error?: string | null;
}

export interface TypeStatistics {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
  total_operations: number;
  total_errors: number;
}

export interface DashboardData {
  system_health: SystemHealth;
  device_health: DeviceHealth[];
  alerts: DeviceAlert[];
  recent_events: DeviceEvent[];
  statistics_by_type: Record<string, TypeStatistics>;
}

@Injectable({
  providedIn: 'root',
})
export class HardwareStatusService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/hardware/status`;

  /**
   * Get complete dashboard data
   */
  getDashboard(): Observable<DashboardData> {
    return this.http
      .get<ApiResponse<DashboardData>>(`${this.apiUrl}/dashboard`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get system health metrics
   */
  getSystemHealth(): Observable<SystemHealth> {
    return this.http
      .get<ApiResponse<SystemHealth>>(`${this.apiUrl}/system-health`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get device health details
   */
  getDeviceHealth(): Observable<DeviceHealth[]> {
    return this.http
      .get<ApiResponse<DeviceHealth[]>>(`${this.apiUrl}/device-health`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get device alerts
   */
  getAlerts(): Observable<DeviceAlert[]> {
    return this.http
      .get<ApiResponse<DeviceAlert[]>>(`${this.apiUrl}/alerts`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get recent events
   */
  getEvents(limit = 50): Observable<DeviceEvent[]> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http
      .get<ApiResponse<DeviceEvent[]>>(`${this.apiUrl}/events`, { params })
      .pipe(map((response) => response.data));
  }

  /**
   * Get statistics by device type
   */
  getStatisticsByType(): Observable<Record<string, TypeStatistics>> {
    return this.http
      .get<ApiResponse<Record<string, TypeStatistics>>>(
        `${this.apiUrl}/statistics-by-type`
      )
      .pipe(map((response) => response.data));
  }
}
