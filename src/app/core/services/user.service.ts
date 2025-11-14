import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  CreateUserRequest,
  UserListItem,
  RoleOption,
  SiteOption,
  UserOptionsResponse,
} from '../models/user-management.model';

interface ApiCollectionResponse<T> {
  data: T[];
  meta?: unknown;
  links?: unknown;
}

interface ApiItemResponse<T> {
  data: T;
}

type UserCollectionApiResponse =
  | UserListItem[]
  | ApiCollectionResponse<UserListItem>;
type UserItemApiResponse = UserListItem | ApiItemResponse<UserListItem>;

interface UserOptionsApiResponse {
  roles: Array<{ id: string; name: string; slug?: string }>;
  sites: Array<{
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly baseUrl = `${environment.apiUrl}/users`;
  private readonly usersSubject = new BehaviorSubject<UserListItem[]>([]);

  readonly users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadUsers(): Observable<UserListItem[]> {
    return this.http.get<UserCollectionApiResponse>(this.baseUrl).pipe(
      map((response) => this.normalizeUserCollection(response)),
      tap((users) => this.usersSubject.next(users))
    );
  }

  createUser(payload: CreateUserRequest): Observable<UserListItem> {
    return this.http.post<UserItemApiResponse>(this.baseUrl, payload).pipe(
      map((response) => this.normalizeUserResponse(response)),
      tap((user) => {
        const current = this.usersSubject.value;
        this.usersSubject.next([...current, user]);
      })
    );
  }

  loadUserOptions(): Observable<UserOptionsResponse> {
    return this.http
      .get<UserOptionsApiResponse>(`${this.baseUrl}/options`)
      .pipe(map((response) => this.normalizeOptionsResponse(response)));
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/${userId}/deactivate`, {})
      .pipe(tap(() => this.refreshUsersAfterMutation()));
  }

  reactivateUser(userId: string): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/${userId}/activate`, {})
      .pipe(tap(() => this.refreshUsersAfterMutation()));
  }

  private refreshUsersAfterMutation(): void {
    this.loadUsers().subscribe({
      error: (error) => {
        console.error('Failed to refresh users after mutation', error);
      },
    });
  }

  private normalizeUserCollection(
    response: UserCollectionApiResponse
  ): UserListItem[] {
    if (Array.isArray(response)) {
      return response.map((user) => this.normalizeUser(user));
    }

    if (this.isApiCollectionResponse(response)) {
      return response.data.map((user) => this.normalizeUser(user));
    }

    return [];
  }

  private normalizeUserResponse(response: UserItemApiResponse): UserListItem {
    const user = this.isApiItemResponse(response) ? response.data : response;

    return this.normalizeUser(user);
  }

  private normalizeUser(user: UserListItem): UserListItem {
    const siteId = user.siteId ?? user.site?.id;
    const roleId = user.roleId ?? user.role?.id;
    const siteCode =
      user.siteCode ?? user.site?.slug ?? user.site?.code ?? undefined;

    return {
      ...user,
      roleId,
      siteId,
      siteCode,
      permissions: user.permissions ?? [],
      metadata: user.metadata ?? {},
    };
  }

  private isApiCollectionResponse(
    response: UserCollectionApiResponse
  ): response is ApiCollectionResponse<UserListItem> {
    return (
      !!response &&
      typeof response === 'object' &&
      !Array.isArray(response) &&
      Array.isArray((response as ApiCollectionResponse<UserListItem>).data)
    );
  }

  private isApiItemResponse(
    response: UserItemApiResponse
  ): response is ApiItemResponse<UserListItem> {
    return (
      !!response &&
      typeof response === 'object' &&
      'data' in response &&
      !Array.isArray((response as ApiItemResponse<UserListItem>).data)
    );
  }

  private normalizeOptionsResponse(
    response: UserOptionsApiResponse
  ): UserOptionsResponse {
    const roles: RoleOption[] = (response.roles ?? []).map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug ?? undefined,
    }));

    const sites: SiteOption[] = (response.sites ?? []).map((site) => ({
      id: site.id,
      name: site.name,
      slug: site.slug ?? undefined,
      description: site.description ?? undefined,
    }));

    return { roles, sites };
  }
}
