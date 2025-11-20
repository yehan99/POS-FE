import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  NotificationListParams,
  NotificationListResponse,
  UserNotification,
} from '../models/notification.model';

interface UnreadCountResponse {
  unread: number;
}

interface MarkAsReadResponse {
  notification: UserNotification;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  constructor(private readonly http: HttpClient) {}

  getNotifications(
    params: NotificationListParams = {}
  ): Observable<NotificationListResponse> {
    let httpParams = new HttpParams();

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params.perPage) {
      httpParams = httpParams.set('perPage', params.perPage.toString());
    }

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }

    return this.http.get<NotificationListResponse>(this.baseUrl, {
      params: httpParams,
    });
  }

  getUnreadCount(): Observable<number> {
    return this.http
      .get<UnreadCountResponse>(`${this.baseUrl}/unread-count`)
      .pipe(map((response) => response?.unread ?? 0));
  }

  markAsRead(notificationId: string): Observable<UserNotification> {
    return this.http
      .patch<MarkAsReadResponse>(`${this.baseUrl}/${notificationId}/read`, {})
      .pipe(map((response) => response.notification));
  }

  markAllAsRead(): Observable<void> {
    return this.http
      .post<{ updated: boolean }>(`${this.baseUrl}/mark-all-read`, {})
      .pipe(map(() => undefined));
  }
}
