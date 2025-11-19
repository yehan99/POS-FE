import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { ProfileService } from '../../core/services/profile.service';
import { ProfileDetails, UserProfileState } from '../../core/models';

const mockProfile: ProfileDetails = {
  avatarUrl: null,
  jobTitle: 'Operations Lead',
  department: 'Retail',
  bio: 'Leads multi-site deployments.',
  preferences: {
    timezone: 'Asia/Colombo',
    language: 'en',
    theme: 'system',
    digestEmails: true,
    notifications: {
      newOrders: true,
      lowStock: true,
      productUpdates: true,
    },
  },
};

const mockState: UserProfileState = {
  user: {
    id: 'user-1',
    email: 'maya@paradisepos.com',
    firstName: 'Maya',
    lastName: 'Perera',
    isActive: true,
    permissions: ['settings.read'],
    role: { id: 'role-1', name: 'Manager', slug: 'manager' },
    site: { id: 'site-1', name: 'Downtown', code: 'DT' },
    tenant: {
      id: 'tenant-1',
      name: 'Paradise Retail',
      businessType: 'retail',
      country: 'LK',
      settings: {},
      phone: '+94 11 123 4567',
    },
    fullName: 'Maya Perera',
    phone: '+94 71 555 1122',
  },
  profile: mockProfile,
  loadedAt: new Date().toISOString(),
};

class ProfileServiceStub {
  profile$ = of(mockState);
  snapshot = mockState;
  loadProfile = jasmine.createSpy('loadProfile').and.returnValue(of(mockState));
  updateProfile = jasmine
    .createSpy('updateProfile')
    .and.returnValue(of(mockState));
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [{ provide: ProfileService, useClass: ProfileServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
