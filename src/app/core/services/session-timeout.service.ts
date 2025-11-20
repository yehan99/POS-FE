import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { merge, fromEvent, Subscription, timer } from 'rxjs';
import { filter, throttleTime, finalize } from 'rxjs/operators';

import { AuthService } from './auth.service';
import {
  SessionTimeoutDialogComponent,
  SessionTimeoutDialogResult,
} from '../../shared/components/session-timeout-dialog/session-timeout-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class SessionTimeoutService implements OnDestroy {
  private readonly DEFAULT_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
  private readonly DEFAULT_WARNING_WINDOW_MS = 60 * 1000;
  private readonly KEEP_ALIVE_INTERVAL_MS = 5 * 60 * 1000;

  private idleTimeoutMs = this.DEFAULT_IDLE_TIMEOUT_MS;
  private warningWindowMs = this.DEFAULT_WARNING_WINDOW_MS;

  private activitySubscription?: Subscription;
  private warningTimerSubscription?: Subscription;
  private finalTimerSubscription?: Subscription;
  private authStateSubscription: Subscription;
  private isWatching = false;
  private warningDialogRef?: MatDialogRef<
    SessionTimeoutDialogComponent,
    SessionTimeoutDialogResult
  >;
  private lastServerActivityAt = 0;
  private lastKeepAliveAt = 0;
  private keepAliveInFlight = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private zone: NgZone,
    private dialog: MatDialog
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

  touch(source: 'user' | 'http' = 'user'): void {
    if (!this.isWatching) {
      return;
    }

    if (source === 'http') {
      this.lastServerActivityAt = Date.now();
    }

    this.resetIdleTimers();

    if (source === 'user') {
      this.maybeSendBackgroundKeepAlive();
    }
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
    const now = Date.now();
    this.lastServerActivityAt = now;
    this.lastKeepAliveAt = now;
    this.touch();
  }

  private stopWatching(): void {
    this.isWatching = false;

    if (this.activitySubscription) {
      this.activitySubscription.unsubscribe();
      this.activitySubscription = undefined;
    }

    this.clearWarningTimer();
    this.clearFinalTimer();
    this.dismissWarningDialog();

    this.keepAliveInFlight = false;
  }

  private resetIdleTimers(): void {
    if (!this.isWatching) {
      return;
    }

    this.clearWarningTimer();
    this.clearFinalTimer();
    this.dismissWarningDialog();

    const warningDelay = Math.max(
      this.idleTimeoutMs - this.warningWindowMs,
      1_000
    );

    this.zone.runOutsideAngular(() => {
      this.warningTimerSubscription = timer(warningDelay).subscribe(() => {
        this.zone.run(() => this.showWarningDialog());
      });
    });
  }

  private showWarningDialog(): void {
    if (!this.isWatching || this.warningDialogRef) {
      return;
    }

    this.warningDialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      disableClose: true,
      width: '400px',
      data: {
        countdownSeconds: Math.max(5, Math.floor(this.warningWindowMs / 1000)),
      },
    });

    this.scheduleFinalTimer();

    this.warningDialogRef.afterClosed().subscribe((result) => {
      this.warningDialogRef = undefined;

      if (result === 'extend') {
        this.sendKeepAlive(true);
      } else if (this.isWatching) {
        this.handleTimeout();
      }
    });
  }

  private scheduleFinalTimer(): void {
    this.clearFinalTimer();

    this.zone.runOutsideAngular(() => {
      this.finalTimerSubscription = timer(this.warningWindowMs).subscribe(
        () => {
          this.zone.run(() => this.handleTimeout());
        }
      );
    });
  }

  private clearWarningTimer(): void {
    if (this.warningTimerSubscription) {
      this.warningTimerSubscription.unsubscribe();
      this.warningTimerSubscription = undefined;
    }
  }

  private clearFinalTimer(): void {
    if (this.finalTimerSubscription) {
      this.finalTimerSubscription.unsubscribe();
      this.finalTimerSubscription = undefined;
    }
  }

  private dismissWarningDialog(closeDialog = true): void {
    if (this.warningDialogRef && closeDialog) {
      this.warningDialogRef.close();
    }
    this.warningDialogRef = undefined;
  }

  private sendKeepAlive(resetTimers: boolean): void {
    if (this.keepAliveInFlight) {
      return;
    }

    this.keepAliveInFlight = true;

    this.authService
      .keepAlive()
      .pipe(
        finalize(() => {
          this.keepAliveInFlight = false;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.idleTimeoutSeconds > 0) {
            this.idleTimeoutMs = response.idleTimeoutSeconds * 1000;
          }

          if (response.warningSeconds > 0) {
            this.warningWindowMs = Math.min(
              this.idleTimeoutMs,
              response.warningSeconds * 1000
            );
          }

          const now = Date.now();
          this.lastKeepAliveAt = now;
          this.lastServerActivityAt = now;

          if (resetTimers) {
            this.resetIdleTimers();
          }
        },
        error: () => this.handleTimeout(),
      });
  }

  private maybeSendBackgroundKeepAlive(): void {
    if (this.keepAliveInFlight) {
      return;
    }

    const now = Date.now();
    const lastServerTouch = Math.max(
      this.lastServerActivityAt,
      this.lastKeepAliveAt
    );

    if (now - lastServerTouch < this.KEEP_ALIVE_INTERVAL_MS) {
      return;
    }

    this.sendKeepAlive(false);
  }

  private handleTimeout(showMessage = true): void {
    if (!this.isWatching) {
      return;
    }

    this.stopWatching();

    if (showMessage) {
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
    }

    this.authService.forceLogout();
  }
}
