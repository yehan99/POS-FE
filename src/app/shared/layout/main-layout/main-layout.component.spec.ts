import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, of } from 'rxjs';

import { MainLayoutComponent } from './main-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models';

class MockAuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.userSubject.asObservable();

  getCurrentUserValue(): User | null {
    return this.userSubject.value;
  }

  setUser(user: User | null): void {
    this.userSubject.next(user);
  }

  logout() {
    return of(null);
  }

  forceLogout(): void {}
}

describe('MainLayoutComponent', () => {
  let component: MainLayoutComponent;
  let fixture: ComponentFixture<MainLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainLayoutComponent],
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MainLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
