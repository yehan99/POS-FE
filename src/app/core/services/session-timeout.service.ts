import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { merge, fromEvent, Subscription, timer } from 'rxjs';
import { filter, throttleTime } from 'rxjs/operators';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService implements OnDestroy {
  private readonly TIMEOUT_MS = 30 * 60 * 1000;

  private activitySubscription?: Subscription;
  private idleTimerSubscription?: Subscription;
  private authStateSubscription: Subscription;
  private isWatching = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    this.authStateSubscription = this.authService.isAuthenticated$.subscribe(
      (isAuthenticated) => {
        if (isAuthenticated) {
          this.startWatching();
        } else {
          this.stopWatching();
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.stopWatching();
    this.authStateSubscription.unsubscribe();
  }

  touch(): void {
    if (!this.isWatching) {
      return;
    }

    this.resetIdleTimer();
  }

  private startWatching(): void {
    if (this.isWatching) {
      this.touch();
      return;
    }

    const activity$ = merge(
      fromEvent(document, 'click'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'touchstart'),
      fromEvent(document, 'scroll'),
      fromEvent(window, 'focus'),
      this.router.events.pipe(filter((event) => event instanceof NavigationEnd))
    ).pipe(throttleTime(1000, undefined, { leading: true, trailing: true }));

    this.activitySubscription = activity$.subscribe(() => this.touch());
    this.isWatching = true;
    this.touch();
  }

  private stopWatching(): void {
    this.isWatching = false;

    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = undefined;
    }

    if (this.idleTimerSubscription) {
      this.idleTimerSubscription.unsubscribe();
      this.idleTimerSubscription = undefined;
    }
  }

  private resetIdleTimer(): void {
    if (!this.isWatching) {
      return;
    }

    if (this.idleTimerSubscription) {
      this.idleTimerSubscription.unsubscribe();
    }

    this.zone.runOutsideAngular(() => {
      this.idleTimerSubscription = timer(this.TIMEOUT_MS).subscribe(() => {
        this.zone.run(() => this.handleTimeout());
      });
    });
  }

  private handleTimeout(): void {
    if (!this.isWatching) {
      return;
    }

    this.stopWatching();
    this.snackBar.open(
      'Session timed out due to inactivity. Please sign in again.',
      'Close',
      {
        duration: 6000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['warning-snackbar'],
      }
    );
    this.authService.forceLogout();
  }
}
