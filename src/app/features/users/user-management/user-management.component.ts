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
  take,
  takeUntil,
} from 'rxjs/operators';

import {
  CreateUserRequest,
  RoleOption,
  SiteOption,
  UserListItem,
  UserQueryParams,
} from '../../../core/models/user-management.model';
import { AuthService } from '../../../core/services/auth.service';
import { SiteService } from '../../../core/services/site.service';
import { UserService } from '../../../core/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { UserEditDialogComponent } from '../user-edit-dialog/user-edit-dialog.component';

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

  overviewCards: Array<{
    key: string;
    label: string;
    value: string;
    helper: string;
    icon: string;
    accent: 'indigo' | 'teal' | 'amber' | 'rose';
  }> = [];

  statusFilters: Array<{
    label: string;
    value: UserQueryParams['status'] | 'all';
    icon: string;
  }> = [
    { label: 'All users', value: 'all', icon: 'all_inclusive' },
    { label: 'Active', value: 'active', icon: 'verified_user' },
    { label: 'Pending invites', value: 'invited', icon: 'drafts' },
    { label: 'Inactive', value: 'inactive', icon: 'pause_circle' },
  ];

  displayedColumns = ['user', 'role', 'site', 'status', 'lastLogin', 'actions'];

  isSubmitting = false;
  isLoadingUsers = false;
  isLoadingOptions = false;
  totalUsers = 0;
  pageSize = 25;
  pageIndex = 0;
  readonly pageSizeOptions = [10, 25, 50, 100];
  activeStatusFilter: UserQueryParams['status'] | 'all' = 'all';
  lastRefreshedAt?: Date;

  private destroy$ = new Subject<void>();
  private pendingActionIds = new Set<string>();
  private currentSiteId: string | null = null;
  isSuperAdmin = false;
  isSiteSelectionLocked = true;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private siteService: SiteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.hasRole('super_admin');
    this.isSiteSelectionLocked = !this.isSuperAdmin;
    this.initializeForm();
    this.observeUsers();
    this.observeSearch();
    this.observeSiteOptions();
    this.observeActiveSite();
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

    if (this.activeStatusFilter !== 'all') {
      query.status = this.activeStatusFilter;
    }

    if (this.currentSiteId) {
      query.siteId = this.currentSiteId;
    }

    this.isLoadingUsers = true;
    this.cdr.markForCheck();

    this.userService.loadUsers(query).subscribe({
      next: () => {
        this.isLoadingUsers = false;
        this.lastRefreshedAt = new Date();
        this.updateOverviewMetrics();
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

  openEditUser(user: UserListItem): void {
    const dialogRef = this.dialog.open(UserEditDialogComponent, {
      width: '640px',
      data: {
        user,
        roles: this.roles,
        sites: this.sites,
        isSuperAdmin: this.isSuperAdmin,
        lockedSiteId: this.currentSiteId,
      },
      disableClose: true,
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((updated) => {
        if (updated) {
          this.refreshUsers();
        }
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
      const normalized = user.status.toLowerCase();

      if (normalized === 'pending' || normalized === 'pending_invite') {
        return 'invited';
      }

      return normalized;
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

    if (this.isSiteSelectionLocked) {
      this.userForm.get('siteId')?.disable({ emitEvent: false });
    }
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

        this.updateOverviewMetrics();
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
          if (sites?.length) {
            this.sites = sites;
          }
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

  private observeSiteOptions(): void {
    this.siteService.sites$
      .pipe(takeUntil(this.destroy$))
      .subscribe((sites) => {
        if (sites.length) {
          this.sites = sites;
          this.patchSiteControl();
        }
        this.cdr.markForCheck();
      });
  }

  private observeActiveSite(): void {
    this.siteService.activeSite$
      .pipe(takeUntil(this.destroy$))
      .subscribe((site) => {
        const nextSiteId = site?.id ?? null;

        if (this.currentSiteId === nextSiteId) {
          return;
        }

        this.currentSiteId = nextSiteId;
        this.patchSiteControl();
        this.refreshUsers();
      });
  }

  private patchSiteControl(): void {
    if (!this.userForm) {
      return;
    }

    const control = this.userForm.get('siteId');
    if (!control) {
      return;
    }

    if (this.isSuperAdmin) {
      control.enable({ emitEvent: false });

      if (this.currentSiteId && !control.dirty) {
        control.setValue(this.currentSiteId, { emitEvent: false });
      }

      return;
    }

    control.disable({ emitEvent: false });

    if (this.currentSiteId && control.value !== this.currentSiteId) {
      control.setValue(this.currentSiteId, { emitEvent: false });
    }
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

  setStatusFilter(filter: UserQueryParams['status'] | 'all'): void {
    if (this.activeStatusFilter === filter) {
      return;
    }

    this.activeStatusFilter = filter;
    this.pageIndex = 0;
    this.refreshUsers();
  }

  get activeUsersOnPage(): number {
    return this.users.filter((user) => this.getStatus(user) === 'active')
      .length;
  }

  get invitedUsersOnPage(): number {
    return this.users.filter((user) => this.getStatus(user) === 'invited')
      .length;
  }

  get inactiveUsersOnPage(): number {
    return this.users.filter((user) => this.getStatus(user) === 'inactive')
      .length;
  }

  get lastUpdatedLabel(): string {
    if (!this.lastRefreshedAt) {
      return 'Live data';
    }

    return `Updated ${this.lastRefreshedAt.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }

  get activeSiteName(): string {
    if (!this.currentSiteId) {
      return '';
    }

    return (
      this.sites.find((site) => site.id === this.currentSiteId)?.name ?? ''
    );
  }

  private updateOverviewMetrics(): void {
    const formattedTotal = this.formatNumber(this.totalUsers);
    const active = this.activeUsersOnPage;
    const invited = this.invitedUsersOnPage;
    const inactive = this.inactiveUsersOnPage;

    this.overviewCards = [
      {
        key: 'total',
        label: 'Total Users',
        value: formattedTotal,
        helper: this.lastUpdatedLabel,
        icon: 'groups',
        accent: 'indigo',
      },
      {
        key: 'active',
        label: 'Active',
        value: this.formatNumber(active),
        helper: 'Enabled on this view',
        icon: 'shield_moon',
        accent: 'teal',
      },
      {
        key: 'invited',
        label: 'Pending Invites',
        value: this.formatNumber(invited),
        helper: 'Awaiting activation',
        icon: 'mark_email_unread',
        accent: 'amber',
      },
      {
        key: 'inactive',
        label: 'Inactive',
        value: this.formatNumber(inactive),
        helper: 'Suspended access',
        icon: 'block',
        accent: 'rose',
      },
    ];
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }
}
