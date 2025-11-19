import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, BehaviorSubject } from 'rxjs';

import { UserManagementComponent } from './user-management.component';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { SiteService } from '../../../core/services/site.service';
import {
  UserListItem,
  UserListState,
  UserOptionsResponse,
} from '../../../core/models/user-management.model';
import { MatDialog } from '@angular/material/dialog';

class MockUserService {
  private usersStateSubject = new BehaviorSubject<UserListState>({
    items: [],
    meta: {
      total: 0,
      perPage: 25,
      currentPage: 1,
      lastPage: 1,
      from: null,
      to: null,
      hasNextPage: false,
    },
  });

  usersState$ = this.usersStateSubject.asObservable();
  loadUsers = jasmine.createSpy('loadUsers').and.returnValue(of({}));
  createUser = jasmine
    .createSpy('createUser')
    .and.returnValue(of({} as UserListItem));
  loadUserOptions = jasmine
    .createSpy('loadUserOptions')
    .and.returnValue(of({ roles: [], sites: [] } as UserOptionsResponse));
  updateUserStatus = jasmine
    .createSpy('updateUserStatus')
    .and.returnValue(of({} as UserListItem));
  archiveUser = jasmine
    .createSpy('archiveUser')
    .and.returnValue(of(void 0));
}

class MockAuthService {
  hasRole() {
    return false;
  }
}

class MockSiteService {
  sites$ = of([]);
  activeSite$ = of(null);
}

class MatDialogStub {
  open() {
    return {
      afterClosed: () => of(false),
    } as any;
  }
}

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserManagementComponent],
      imports: [ReactiveFormsModule, MatSnackBarModule],
      providers: [
        { provide: UserService, useClass: MockUserService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: SiteService, useClass: MockSiteService },
        { provide: MatDialog, useClass: MatDialogStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
