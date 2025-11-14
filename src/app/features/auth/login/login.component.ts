import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  @ViewChild('googleButton', { static: false })
  googleButton!: ElementRef<HTMLDivElement>;

  isLoading = false;
  errorMessage = '';
  googleReady = false;
  private googleInitialized = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.ensureGoogleClientLoaded();
    }, 0);
  }

  ngOnDestroy(): void {
    this.cleanupGooglePrompt();
  }

  private ensureGoogleClientLoaded(): void {
    if (!environment.googleClientId) {
      this.errorMessage =
        'Google login is not configured. Please contact your administrator.';
      return;
    }

    const google = (window as any).google;
    if (google?.accounts?.id) {
      this.initializeGoogleButton();
      return;
    }

    const existingScript = document.getElementById('google-identity-script');
    if (existingScript) {
      existingScript.addEventListener(
        'load',
        () => this.initializeGoogleButton(),
        { once: true }
      );
      existingScript.addEventListener(
        'error',
        () => this.handleGoogleScriptError(false),
        { once: true }
      );
      return;
    }

    this.loadGoogleIdentityScript(environment.googleClientScriptUrl);
  }

  private loadGoogleIdentityScript(src: string, isFallback = false): void {
    const script = document.createElement('script');
    script.src = src;
    script.id = 'google-identity-script';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeGoogleButton();
    script.onerror = () => {
      script.remove();

      if (
        !isFallback &&
        environment.googleClientScriptFallback &&
        src !== environment.googleClientScriptFallback
      ) {
        this.loadGoogleIdentityScript(
          environment.googleClientScriptFallback,
          true
        );
        return;
      }

      this.handleGoogleScriptError(isFallback);
    };

    document.head.appendChild(script);
  }

  private handleGoogleScriptError(fallbackAttempted: boolean): void {
    this.errorMessage = fallbackAttempted
      ? 'Failed to load Google authentication. Ensure the fallback script is available and refresh the page.'
      : 'Failed to load Google authentication from Google. Please refresh the page.';

    this.snackBar.open(this.errorMessage, 'Close', {
      duration: 6000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private initializeGoogleButton(): void {
    if (this.googleInitialized || !this.googleButton) {
      return;
    }

    const google = (window as any).google;
    if (!google?.accounts?.id) {
      return;
    }

    this.googleInitialized = true;
    this.errorMessage = '';
    this.ngZone.run(() => {
      this.googleReady = false;
    });

    this.ngZone.runOutsideAngular(() => {
      try {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) =>
            this.ngZone.run(() => this.handleGoogleCredential(response)),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        google.accounts.id.renderButton(this.googleButton.nativeElement, {
          theme: 'filled_blue',
          size: 'large',
          type: 'standard',
          text: 'signin_with',
          width: 320,
        });

        google.accounts.id.prompt();

        this.ngZone.run(() => {
          this.googleReady = true;
        });
      } catch (error) {
        this.ngZone.run(() => {
          this.googleReady = false;
          this.errorMessage =
            'Google sign-in could not be initialized. Check the console for details.';
        });

        console.error('Google Identity initialization failed', error);

        this.snackBar.open(
          'Google sign-in could not be initialized. Please refresh and try again.',
          'Close',
          {
            duration: 6000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          }
        );

        this.googleInitialized = false;
      }
    });
  }

  private handleGoogleCredential(response: any): void {
    if (!response?.credential) {
      return;
    }

    this.isLoading = true;

    this.authService.loginWithGoogle(response.credential).subscribe({
      next: () => {
        this.isLoading = false;
        this.snackBar.open('Login successful!', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage =
          error?.error?.message ||
          'Google sign-in failed. Please try again or contact support.';

        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  private cleanupGooglePrompt(): void {
    const google = (window as any).google;
    if (google?.accounts?.id) {
      google.accounts.id.cancel();
    }
  }
}
