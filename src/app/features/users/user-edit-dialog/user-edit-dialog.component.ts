import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs/operators';

import {
  RoleOption,
  SiteOption,
  UpdateUserRequest,
  UserListItem,
} from '../../../core/models/user-management.model';
import { UserService } from '../../../core/services/user.service';

export interface UserEditDialogData {
  user: UserListItem;
  roles: RoleOption[];
  sites: SiteOption[];
  isSuperAdmin: boolean;
  lockedSiteId?: string | null;
}

@Component({
  selector: 'app-user-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-edit-dialog.component.html',
  styleUrl: './user-edit-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserEditDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogRef = inject(MatDialogRef<UserEditDialogComponent>);
  readonly data: UserEditDialogData = inject(MAT_DIALOG_DATA);

  roles: RoleOption[] = [...(this.data.roles ?? [])];
  sites: SiteOption[] = [...(this.data.sites ?? [])];
  readonly isSuperAdmin = this.data.isSuperAdmin;
  readonly form: FormGroup = this.buildForm();

  isSaving = false;
  isLoadingOptions = false;

  private readonly lockedSiteId: string | null = this.data.lockedSiteId ?? null;

  ngOnInit(): void {
    this.ensureOptionsLoaded();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();

    this.isSaving = true;
    this.cdr.markForCheck();

    this.userService
      .updateUser(this.data.user.id, payload)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('User updated successfully.', 'Close', {
            duration: 3500,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            'Unable to update the user right now. Please try again.';
          this.snackBar.open(message, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  cancel(): void {
    if (this.isSaving) {
      return;
    }

    this.dialogRef.close(false);
  }

  trackById(_: number, option: RoleOption | SiteOption): string {
    return option.id;
  }

  private buildPayload(): UpdateUserRequest {
    const raw = this.form.getRawValue();

    const payload: UpdateUserRequest = {
      firstName: raw.firstName?.trim() || undefined,
      lastName: raw.lastName?.trim() || undefined,
      email: raw.email?.trim().toLowerCase() || undefined,
      phone: raw.phone?.trim() || undefined,
      roleId: raw.roleId || undefined,
      isActive: raw.isActive,
    };

    if (this.isSuperAdmin) {
      payload.siteId = raw.siteId || undefined;
    } else if (this.lockedSiteId) {
      payload.siteId = this.lockedSiteId;
    }

    return payload;
  }

  private resolveRoleId(user: UserListItem): string {
    return user.role?.id ?? user.roleId ?? '';
  }

  private resolveSiteId(user: UserListItem): string {
    return user.site?.id ?? user.siteId ?? this.lockedSiteId ?? '';
  }

  private buildForm(): FormGroup {
    const user = this.data.user;

    const form = this.fb.group({
      firstName: [
        user.firstName ?? '',
        [Validators.required, Validators.minLength(2)],
      ],
      lastName: [
        user.lastName ?? '',
        [Validators.required, Validators.minLength(2)],
      ],
      email: [user.email ?? '', [Validators.required, Validators.email]],
      phone: [user.phone ?? ''],
      roleId: [this.resolveRoleId(user), Validators.required],
      siteId: [this.resolveSiteId(user), Validators.required],
      isActive: [user.isActive ?? true],
    });

    if (!this.isSuperAdmin) {
      form.get('siteId')?.disable({ emitEvent: false });
    }

    return form;
  }

  private ensureOptionsLoaded(): void {
    const sitesMissing = !this.sites.length;
    const rolesMissing = !this.roles.length;

    if (!rolesMissing && !sitesMissing) {
      return;
    }

    this.isLoadingOptions = true;
    this.cdr.markForCheck();

    this.userService
      .loadUserOptions()
      .pipe(
        finalize(() => {
          this.isLoadingOptions = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: ({ roles, sites }) => {
          if (roles?.length) {
            this.roles = roles;
          }

          if (sites?.length) {
            this.sites = sites;
          }

          this.cdr.markForCheck();
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            'Unable to load role and site options. Please try again.';

          this.snackBar.open(message, 'Close', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }
}
