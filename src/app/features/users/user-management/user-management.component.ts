import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import {
  CreateUserRequest,
  RoleOption,
  SiteOption,
  UserListItem,
} from '../../../core/models/user-management.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
})
export class UserManagementComponent implements OnInit, OnDestroy {
  userForm!: FormGroup;
  users: UserListItem[] = [];
  roles: RoleOption[] = [];
  sites: SiteOption[] = [];

  displayedColumns = ['user', 'role', 'site', 'status', 'lastLogin'];

  isSubmitting = false;
  isLoadingUsers = false;
  isLoadingOptions = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.observeUsers();
    this.loadOptions();
    this.refreshUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshUsers(): void {
    this.isLoadingUsers = true;
    this.userService.loadUsers().subscribe({
      next: () => {
        this.isLoadingUsers = false;
      },
      error: (error) => {
        this.isLoadingUsers = false;
        const message =
          error?.error?.message || 'Failed to load users. Please try again.';
        this.snackBar.open(message, 'Close', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  submit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.value;
    const payload: CreateUserRequest = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim(),
      email: formValue.email.trim().toLowerCase(),
      roleId: formValue.roleId,
      siteId: formValue.siteId,
      phone: formValue.phone ? formValue.phone.trim() : undefined,
    };

    this.isSubmitting = true;

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('User invited successfully.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'],
        });
        this.userForm.reset({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          roleId: '',
          siteId: '',
        });
        this.userForm.markAsPristine();
        this.userForm.markAsUntouched();
      },
      error: (error) => {
        this.isSubmitting = false;
        const message =
          error?.error?.message || 'Unable to invite user. Please try again.';
        this.snackBar.open(message, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getRoleName(roleId: string): string {
    const role = this.roles.find((r) => r.id === roleId);
    return role?.name ?? '—';
  }

  getRoleDisplay(user: UserListItem): string {
    if (user.role?.name) {
      return user.role.name;
    }

    const fallbackRoleId =
      user.role?.id ?? user.roleId ?? (user.metadata?.['roleId'] as string);

    if (fallbackRoleId) {
      return this.getRoleName(fallbackRoleId);
    }

    return '—';
  }

  getSiteLabel(user: UserListItem): string {
    const metadataSiteId = user.metadata?.['siteId'] as string | undefined;
    const directSiteId = user.siteId ?? metadataSiteId;

    if (user.site?.name) {
      return user.site.name;
    }

    return (
      this.getSiteNameFromId(directSiteId) ??
      user.siteCode ??
      (user.metadata?.['siteCode'] as string | undefined) ??
      '—'
    );
  }

  getStatus(user: UserListItem): string {
    if (user.status) {
      return user.status;
    }
    return user.isActive ? 'active' : 'inactive';
  }

  trackByUser(_: number, user: UserListItem): string {
    return user.id;
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      roleId: ['', Validators.required],
      siteId: ['', Validators.required],
    });
  }

  private observeUsers(): void {
    this.userService.users$
      .pipe(takeUntil(this.destroy$))
      .subscribe((users) => {
        this.users = users;
      });
  }

  private loadOptions(): void {
    this.isLoadingOptions = true;
    this.userService
      .loadUserOptions()
      .pipe(finalize(() => (this.isLoadingOptions = false)))
      .subscribe({
        next: ({ roles, sites }) => {
          this.roles = roles;
          this.sites = sites;
        },
        error: (error) => {
          const message =
            error?.error?.message ||
            'Failed to load user options. Please try again later.';
          this.snackBar.open(message, 'Close', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        },
      });
  }

  private getSiteNameFromId(id?: string): string | undefined {
    if (!id) {
      return undefined;
    }
    const site = this.sites.find((option) => option.id === id);
    return site?.name;
  }
}
