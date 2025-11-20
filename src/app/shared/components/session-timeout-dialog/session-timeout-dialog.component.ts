import { Component, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subscription, interval } from 'rxjs';

export type SessionTimeoutDialogResult = 'extend' | 'logout';

export interface SessionTimeoutDialogData {
  countdownSeconds: number;
}

@Component({
  selector: 'app-session-timeout-dialog',
  standalone: false,
  templateUrl: './session-timeout-dialog.component.html',
  styleUrl: './session-timeout-dialog.component.scss',
})
export class SessionTimeoutDialogComponent implements OnDestroy {
  countdownSeconds = 1;
  private readonly countdownSub: Subscription;

  constructor(
    private dialogRef: MatDialogRef<
      SessionTimeoutDialogComponent,
      SessionTimeoutDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: SessionTimeoutDialogData
  ) {
    this.countdownSeconds = Math.max(1, Math.floor(data.countdownSeconds));

    this.countdownSub = interval(1000).subscribe(() => {
      if (this.countdownSeconds <= 1) {
        this.dialogRef.close('logout');
        return;
      }

      this.countdownSeconds -= 1;
    });
  }

  ngOnDestroy(): void {
    this.countdownSub.unsubscribe();
  }

  staySignedIn(): void {
    this.dialogRef.close('extend');
  }

  signOutNow(): void {
    this.dialogRef.close('logout');
  }
}
