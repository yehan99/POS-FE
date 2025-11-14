import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'pos_access_token';
  private readonly REFRESH_TOKEN_KEY = 'pos_refresh_token';
  private readonly USER_KEY = 'pos_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  /**
   * Initialize authentication state from stored tokens
   */
  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getStoredUser();

    if (token && user && !this.isTokenExpired(token)) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      this.clearAuth();
    }
  }

  /**
   * Login user with email and password
   */
  login(credentials: LoginRequest): Observable<AuthTokens> {
    const payload = {
      ...credentials,
      deviceName: credentials.deviceName ?? 'web',
    };

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        tap((response) => {
          this.setTokens(response);

          if (response.user) {
            const user = this.persistUser(response.user);
            this.currentUserSubject.next(user);
          } else {
            this.persistUser(null);
            this.currentUserSubject.next(null);
          }

          this.isAuthenticatedSubject.next(true);
        }),
        map((response) => this.extractTokens(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Login user with Google credential
   */
  loginWithGoogle(idToken: string): Observable<AuthTokens> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/google`, { idToken })
      .pipe(
        tap((response) => {
          this.setTokens(response);

          if (response.user) {
            const user = this.persistUser(response.user);
            this.currentUserSubject.next(user);
          } else {
            this.persistUser(null);
            this.currentUserSubject.next(null);
          }

          this.isAuthenticatedSubject.next(true);
        }),
        map((response) => this.extractTokens(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user and business
   */
  register(userData: RegisterRequest): Observable<AuthTokens> {
    const payload: RegisterRequest = {
      ...userData,
      deviceName: userData.deviceName ?? 'web',
      roleSlug: userData.roleSlug ?? 'admin',
    };

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload)
      .pipe(
        tap((response) => {
          this.setTokens(response);

          if (response.user) {
            const user = this.persistUser(response.user);
            this.currentUserSubject.next(user);
          } else {
            this.persistUser(null);
            this.currentUserSubject.next(null);
          }

          this.isAuthenticatedSubject.next(true);
        }),
        map((response) => this.extractTokens(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearAuth()),
      catchError(() => {
        // Clear auth even if logout request fails
        this.clearAuth();
        return throwError(() => new Error('Logout failed'));
      })
    );
  }

  /**
   * Immediately clear auth state and navigate to login
   */
  forceLogout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => this.setTokens(response)),
        map((response) => this.extractTokens(response)),
        catchError((error) => {
          this.clearAuth();
          return throwError(() => error);
        })
      );
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<{ user: User }>(`${environment.apiUrl}/auth/me`).pipe(
      map((response) => {
        const user = this.persistUser(response.user);
        if (!user) {
          throw new Error('Failed to load user profile');
        }
        return user;
      }),
      tap((user) => {
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Request password reset
   */
  requestPasswordReset(email: string): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/auth/password-reset-request`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, password: string): Observable<any> {
    return this.http
      .post(`${environment.apiUrl}/auth/password-reset`, {
        token,
        password,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.currentUserSubject.value;
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasRole(roles: string | string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user?.role?.slug) {
      return false;
    }

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.some((role) => role === user.role?.slug);
  }

  /**
   * Get stored access token
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Get stored refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Get current user value (synchronous)
   */
  getCurrentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if current user is authenticated
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Store tokens in localStorage
   */
  private setTokens(tokens: AuthTokens): void {
    if (tokens.accessToken) {
      localStorage.setItem(this.TOKEN_KEY, tokens.accessToken);
    } else {
      localStorage.removeItem(this.TOKEN_KEY);
    }

    if (tokens.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    } else {
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (!userStr) {
        return null;
      }

      const parsed = JSON.parse(userStr);
      return this.normalizeUser(parsed);
    } catch (error) {
      console.error('Failed to parse stored user', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError = (error: any): Observable<never> => {
    console.error('Auth error:', error);

    if (error.status === 401) {
      this.clearAuth();
      this.router.navigate(['/auth/login']);
    }

    return throwError(() => error);
  };

  private persistUser(user: User | null): User | null {
    if (!user) {
      localStorage.removeItem(this.USER_KEY);
      return null;
    }

    const normalized = this.normalizeUser(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalized));
    return normalized;
  }

  private normalizeUser(user: any): User {
    if (!user) {
      throw new Error('User payload is empty');
    }

    const tenant = user.tenant
      ? {
          id: String(user.tenant.id),
          name: user.tenant.name,
          businessType: user.tenant.businessType,
          country: user.tenant.country,
          phone: user.tenant.phone ?? undefined,
          settings: user.tenant.settings ?? undefined,
        }
      : undefined;

    const roleSource =
      user.role ??
      user.primaryRole ??
      (user.roles && Array.isArray(user.roles) ? user.roles[0] : undefined);

    const role = roleSource
      ? {
          id: String(
            roleSource.id ??
              roleSource.slug ??
              roleSource.code ??
              roleSource.name ??
              ''
          ),
          name: roleSource.name ?? roleSource.label ?? roleSource.slug ?? '',
          slug:
            roleSource.slug ??
            roleSource.code ??
            roleSource.name ??
            user.roleSlug ??
            user.role_slug ??
            '',
        }
      : user.roleSlug || user.role_slug
      ? {
          id: String(user.roleSlug ?? user.role_slug),
          name:
            user.roleName ??
            user.role_name ??
            String(user.roleSlug ?? user.role_slug),
          slug: String(user.roleSlug ?? user.role_slug),
        }
      : undefined;

    const siteSource =
      user.site ?? user.branch ?? user.location ?? user.defaultSite;
    const site = siteSource
      ? {
          id: String(
            siteSource.id ??
              siteSource.code ??
              siteSource.slug ??
              siteSource.name
          ),
          name:
            siteSource.name ?? siteSource.displayName ?? siteSource.title ?? '',
          code: String(
            siteSource.code ??
              siteSource.slug ??
              siteSource.id ??
              siteSource.name ??
              ''
          ),
        }
      : undefined;

    let permissions: string[] = [];

    if (Array.isArray(user.permissions)) {
      permissions = user.permissions
        .map((permission: any) => String(permission))
        .filter(
          (permission: string, index: number, self: string[]) =>
            self.indexOf(permission) === index
        );
    }

    const email =
      user.email ?? user.primaryEmail ?? user.username ?? user.userName ?? '';

    const derivedFirstName =
      user.firstName ??
      user.first_name ??
      user.givenName ??
      user.given_name ??
      (user.fullName ?? user.full_name)?.split(' ')?.[0] ??
      email.split('@')[0] ??
      '';

    const derivedLastName =
      user.lastName ??
      user.last_name ??
      user.familyName ??
      user.family_name ??
      (user.fullName ?? user.full_name)?.split(' ')?.slice(1).join(' ') ??
      '';

    return {
      id: String(user.id ?? user.userId ?? user.uid ?? email),
      email,
      firstName: derivedFirstName,
      lastName: derivedLastName,
      fullName: user.fullName ?? undefined,
      phone: user.phone ?? undefined,
      avatar: user.avatar ?? undefined,
      isActive:
        typeof user.isActive === 'boolean'
          ? user.isActive
          : Boolean(user.is_active),
      permissions,
      lastLoginAt: user.lastLoginAt ?? user.last_login_at ?? undefined,
      createdAt: user.createdAt ?? user.created_at ?? undefined,
      updatedAt: user.updatedAt ?? user.updated_at ?? undefined,
      tenant,
      role,
      site,
      status:
        typeof user.status === 'string'
          ? user.status
          : (() => {
              if (typeof user.isActive === 'boolean') {
                return user.isActive ? 'active' : 'inactive';
              }
              if (typeof user.is_active === 'boolean') {
                return user.is_active ? 'active' : 'inactive';
              }
              return undefined;
            })(),
      metadata: user.metadata ?? undefined,
    };
  }

  private extractTokens(response: AuthResponse): AuthTokens {
    return {
      accessToken:
        response.accessToken ??
        (response as any).access_token ??
        (response as any).token,
      refreshToken:
        response.refreshToken ?? (response as any).refresh_token ?? '',
      expiresIn: response.expiresIn ?? (response as any).expires_in ?? 0,
      tokenType: response.tokenType ?? (response as any).token_type ?? 'Bearer',
      refreshExpiresIn:
        response.refreshExpiresIn ?? (response as any).refresh_expires_in,
    };
  }
}
