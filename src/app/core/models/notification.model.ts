export type NotificationSeverity =
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'critical'
  | string
  | null;

export interface UserNotification {
  id: string;
  title: string;
  body: string;
  category?: string | null;
  severity?: NotificationSeverity;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string | null;
}

export interface NotificationListMeta {
  total: number;
  perPage: number;
  currentPage: number;
  hasMorePages: boolean;
}

export interface NotificationListResponse {
  data: UserNotification[];
  meta: NotificationListMeta;
}

export interface NotificationListParams {
  status?: 'all' | 'unread';
  perPage?: number;
  page?: number;
}
