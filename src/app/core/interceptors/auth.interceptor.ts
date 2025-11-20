import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { SessionTimeoutService } from '../services/session-timeout.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private authService: AuthService,
    private sessionTimeout: SessionTimeoutService
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Add auth token to requests
    const authToken = this.authService.getToken();

    if (authToken && !this.isAuthUrl(request.url)) {
      request = this.addTokenToRequest(request, authToken);
      this.sessionTimeout.touch('http');
    }

    return next.handle(request).pipe(
      catchError((error) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !this.isAuthUrl(request.url)
        ) {
          return this.handle401Error(request, next, error);
        }
        return throwError(() => error);
      })
    );
  }

  private addTokenToRequest(
    request: HttpRequest<any>,
    token: string
  ): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  private handle401Error(
    request: HttpRequest<any>,
    next: HttpHandler,
    originalError: HttpErrorResponse
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      const refreshToken = this.authService.getRefreshToken();

      if (!refreshToken) {
        this.isRefreshing = false;
        this.authService.forceLogout();
        return throwError(() => originalError);
      }

      return this.authService.refreshToken().pipe(
        switchMap((tokens) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(tokens.accessToken);
          this.sessionTimeout.touch('http');
          return next.handle(
            this.addTokenToRequest(request, tokens.accessToken)
          );
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.forceLogout();
          return throwError(() => error);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => {
        const accessToken = token as string;
        this.sessionTimeout.touch('http');
        return next.handle(this.addTokenToRequest(request, accessToken));
      }),
      catchError((error) => {
        this.authService.forceLogout();
        return throwError(() => error);
      })
    );
  }

  private isAuthUrl(url: string): boolean {
    return (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/google') ||
      url.includes('/auth/password-reset')
    );
  }
}
