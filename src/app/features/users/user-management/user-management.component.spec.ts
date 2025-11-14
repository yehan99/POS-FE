import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, BehaviorSubject } from 'rxjs';

import { UserManagementComponent } from './user-management.component';
import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { UserListItem } from '../../../core/models/user-management.model';

class MockUserService {
  private usersSubject = new BehaviorSubject<UserListItem[]>([]);
  users$ = this.usersSubject.asObservable();
  loadUsers = jasmine.createSpy('loadUsers').and.returnValue(of([]));
  createUser = jasmine
    .createSpy('createUser')
    .and.returnValue(of({} as UserListItem));
}

class MockRoleService {
  getActiveRoles() {
    return of([]);
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
        { provide: RoleService, useClass: MockRoleService },
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
