import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  CreateUserRequest,
  RoleOption,
  SiteOption,
  UserListItem,
  UserListState,
  UserOptionsResponse,
  UserPaginationMeta,
  UserQueryParams,
} from '../models/user-management.model';

interface ApiCollectionResponse<T> {
  data: T[];
  meta?: {
    current_page?: number;
    currentPage?: number;
    per_page?: number;
    perPage?: number;
    total?: number;
    last_page?: number;
    lastPage?: number;
    from?: number | null;
    to?: number | null;
    [key: string]: unknown;
  };
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
  private lastQuery: UserQueryParams = { page: 1, perPage: 25 };
  private readonly usersStateSubject = new BehaviorSubject<UserListState>({
    items: [],
    meta: {
      total: 0,
      perPage: this.clampPerPage(this.lastQuery.perPage ?? 25),
      currentPage: this.lastQuery.page ?? 1,
      lastPage: 1,
      from: null,
      to: null,
      hasNextPage: false,
    },
  });

  readonly usersState$ = this.usersStateSubject.asObservable();
  readonly users$ = this.usersState$.pipe(map((state) => state.items));

  constructor(private http: HttpClient) {}

  loadUsers(query: UserQueryParams = {}): Observable<UserListState> {
    const normalizedQuery = this.normalizeQuery(query);
    this.lastQuery = normalizedQuery;

    return this.http
      .get<UserCollectionApiResponse>(this.baseUrl, {
        params: this.buildHttpParams(normalizedQuery),
      })
      .pipe(
        map((response) => this.normalizeUserCollection(response)),
        tap((state) => this.usersStateSubject.next(state))
      );
  }

  createUser(payload: CreateUserRequest): Observable<UserListItem> {
    return this.http.post<UserItemApiResponse>(this.baseUrl, payload).pipe(
      map((response) => this.normalizeUserResponse(response)),
      tap(() => this.refreshUsersAfterMutation())
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
    this.loadUsers(this.lastQuery)
      .pipe(take(1))
      .subscribe({
        error: (error) => {
          console.error('Failed to refresh users after mutation', error);
        },
      });
  }

  private normalizeUserCollection(
    response: UserCollectionApiResponse
  ): UserListState {
    if (Array.isArray(response)) {
      const items = response.map((user) => this.normalizeUser(user));
      return {
        items,
        meta: this.createFallbackMeta(items.length),
      };
    }

    if (this.isApiCollectionResponse(response)) {
      const items = response.data.map((user) => this.normalizeUser(user));
      return {
        items,
        meta: this.normalizePaginationMeta(response.meta, items.length),
      };
    }

    return {
      items: [],
      meta: this.createFallbackMeta(0),
    };
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

  private normalizeQuery(query: UserQueryParams): UserQueryParams {
    const perPage = this.clampPerPage(
      query.perPage ?? this.lastQuery.perPage ?? 25
    );
    const page = Math.max(1, query.page ?? this.lastQuery.page ?? 1);
    const rawSearch = (query.search ?? '').trim();
    const search = rawSearch ? rawSearch.slice(0, 120) : undefined;
    const status = this.sanitizeStatus(query.status);

    const nextQuery: UserQueryParams = {
      perPage,
      page,
    };

    if (search) {
      nextQuery.search = search;
    }

    if (status) {
      nextQuery.status = status;
    }

    return nextQuery;
  }

  private buildHttpParams(query: UserQueryParams): HttpParams {
    let params = new HttpParams()
      .set('page', String(query.page ?? 1))
      .set('perPage', String(query.perPage ?? 25));

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    return params;
  }

  private sanitizeStatus(
    status: UserQueryParams['status']
  ): UserQueryParams['status'] {
    if (!status) {
      return undefined;
    }

    const allowed: Array<UserQueryParams['status']> = [
      'active',
      'inactive',
      'invited',
    ];

    return allowed.includes(status) ? status : undefined;
  }

  private normalizePaginationMeta(
    meta: ApiCollectionResponse<UserListItem>['meta'],
    itemCount: number
  ): UserPaginationMeta {
    if (!meta || typeof meta !== 'object') {
      return this.createFallbackMeta(itemCount);
    }

    const total = this.parseNumber(meta.total, itemCount);
    const perPage = this.clampPerPage(
      this.parseNumber(
        meta.per_page ?? meta.perPage,
        this.lastQuery.perPage ?? 25
      )
    );
    const currentPage = Math.max(
      1,
      this.parseNumber(
        meta.current_page ?? meta.currentPage,
        this.lastQuery.page ?? 1
      )
    );
    const lastPage = Math.max(
      1,
      this.parseNumber(
        meta.last_page ?? meta.lastPage,
        Math.max(1, Math.ceil(total / (perPage || 1)))
      )
    );
    const from = this.parseNullableNumber(meta.from);
    const to = this.parseNullableNumber(meta.to);

    return {
      total,
      perPage,
      currentPage,
      lastPage,
      from,
      to,
      hasNextPage: currentPage < lastPage,
    };
  }

  private createFallbackMeta(count: number): UserPaginationMeta {
    const perPage = this.clampPerPage(this.lastQuery.perPage ?? 25);
    const currentPage = this.lastQuery.page ?? 1;
    const hasItems = count > 0;

    return {
      total: count,
      perPage,
      currentPage,
      lastPage: 1,
      from: hasItems ? 1 : null,
      to: hasItems ? count : null,
      hasNextPage: false,
    };
  }

  private clampPerPage(perPage: number): number {
    const value = Number.isFinite(perPage) ? perPage : 25;
    return Math.min(Math.max(Math.floor(value), 1), 100);
  }

  private parseNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private parseNullableNumber(value: unknown): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
