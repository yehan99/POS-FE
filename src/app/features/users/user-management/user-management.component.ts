import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  finalize,
  takeUntil,
} from 'rxjs/operators';

import {
  CreateUserRequest,
  RoleOption,
  SiteOption,
  UserListItem,
  UserQueryParams,
} from '../../../core/models/user-management.model';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-management',
  standalone: false,
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit, OnDestroy {
  @ViewChild('inviteFormRef') inviteFormRef?: ElementRef<HTMLDivElement>;
  userForm!: FormGroup;
  users: UserListItem[] = [];
  roles: RoleOption[] = [];
  sites: SiteOption[] = [];
  searchControl = new FormControl<string>('', { nonNullable: true });

  displayedColumns = ['user', 'role', 'site', 'status', 'lastLogin', 'actions'];

  isSubmitting = false;
  isLoadingUsers = false;
  isLoadingOptions = false;
  totalUsers = 0;
  pageSize = 25;
  pageIndex = 0;
  readonly pageSizeOptions = [10, 25, 50, 100];

  private destroy$ = new Subject<void>();
  private pendingActionIds = new Set<string>();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.observeUsers();
    this.observeSearch();
    this.loadOptions();
    this.refreshUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshUsers(): void {
    const sanitizedSearch = this.sanitizeSearchTerm(this.searchControl.value);

    if (sanitizedSearch !== this.searchControl.value) {
      this.searchControl.setValue(sanitizedSearch, { emitEvent: false });
    }

    const query: UserQueryParams = {
      page: this.pageIndex + 1,
      perPage: this.pageSize,
    };

    if (sanitizedSearch) {
      query.search = sanitizedSearch;
    }

    this.isLoadingUsers = true;
    this.cdr.markForCheck();

    this.userService.loadUsers(query).subscribe({
      next: () => {
        this.isLoadingUsers = false;
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
    });
  }

  scrollToInviteForm(): void {
    const hostElement = this.inviteFormRef?.nativeElement;
    if (!hostElement) {
      return;
    }

    hostElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const firstInput = hostElement.querySelector('input');
    if (firstInput instanceof HTMLInputElement) {
      setTimeout(() => firstInput.focus(), 200);
    }
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
    this.cdr.markForCheck();

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
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
      },
    });
  }

  handlePageEvent(event: PageEvent): void {
    if (
      this.pageSize === event.pageSize &&
      this.pageIndex === event.pageIndex
    ) {
      return;
    }

    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.cdr.markForCheck();
    this.refreshUsers();
  }

  clearSearch(): void {
    if (!this.searchControl.value) {
      return;
    }
    this.searchControl.setValue('', { emitEvent: true });
  }

  isActionPending(userId: string): boolean {
    return this.pendingActionIds.has(userId);
  }

  setUserStatus(user: UserListItem, isActive: boolean): void {
    if (this.isActionPending(user.id) || user.isActive === isActive) {
      return;
    }

    this.beginAction(user.id);
    this.userService
      .updateUserStatus(user.id, isActive)
      .pipe(finalize(() => this.endAction(user.id)))
      .subscribe({
        next: () => {
          const message = isActive
            ? 'User activated successfully.'
            : 'User deactivated successfully.';
          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.handleActionError(
            error,
            'Unable to update user status. Please try again.'
          );
        },
      });
  }

  archiveUser(user: UserListItem): void {
    if (this.isActionPending(user.id)) {
      return;
    }

    this.beginAction(user.id);
    this.userService
      .archiveUser(user.id)
      .pipe(finalize(() => this.endAction(user.id)))
      .subscribe({
        next: () => {
          this.snackBar.open('User archived successfully.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.handleActionError(error, 'Unable to archive user right now.');
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
    this.userService.usersState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((state) => {
        this.users = state.items;
        this.totalUsers = state.meta.total;

        if (this.pageSize !== state.meta.perPage) {
          this.pageSize = state.meta.perPage;
        }

        const nextPageIndex = Math.max(state.meta.currentPage - 1, 0);
        if (this.pageIndex !== nextPageIndex) {
          this.pageIndex = nextPageIndex;
        }

        this.cdr.markForCheck();
      });
  }

  private observeSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        const sanitized = this.sanitizeSearchTerm(term);

        if (sanitized !== term) {
          this.searchControl.setValue(sanitized, { emitEvent: false });
        }

        this.pageIndex = 0;
        this.refreshUsers();
      });
  }

  private loadOptions(): void {
    this.isLoadingOptions = true;
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
          this.roles = roles;
          this.sites = sites;
          this.cdr.markForCheck();
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
          this.cdr.markForCheck();
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

  private sanitizeSearchTerm(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.trim().slice(0, 120);
  }

  private beginAction(userId: string): void {
    this.pendingActionIds.add(userId);
    this.cdr.markForCheck();
  }

  private endAction(userId: string): void {
    this.pendingActionIds.delete(userId);
    this.cdr.markForCheck();
  }

  private handleActionError(error: any, fallbackMessage: string): void {
    const message =
      error?.error?.message ??
      error?.message ??
      fallbackMessage ??
      'Something went wrong. Please try again later.';

    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
    this.cdr.markForCheck();
  }
}
