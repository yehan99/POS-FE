import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';

import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../core/services/settings.service';
import { SiteService } from '../../core/services/site.service';
import { SettingsState } from '../../core/models/settings.model';

const mockState: SettingsState = {
  general: {
    businessName: 'Paradise POS',
    businessEmail: 'admin@paradisepos.com',
    businessPhone: '+94 11 555 1234',
    timezone: 'Asia/Colombo',
    currency: 'LKR',
    locale: 'en-US',
    invoicePrefix: 'INV',
    invoiceStartNumber: 1000,
    defaultSiteId: null,
  },
  notifications: {
    sendDailySummary: true,
    lowStockAlerts: true,
    newOrderAlerts: true,
    digestFrequency: 'daily',
    escalationEmail: 'ops@paradisepos.com',
  },
  updatedAt: new Date().toISOString(),
};

class SettingsServiceStub {
  settings$ = of(mockState);
  loadSettings() {
    return of(mockState);
  }
  updateGeneralSettings() {
    return of(mockState);
  }
  updateNotificationSettings() {
    return of(mockState);
  }
}

class SiteServiceStub {
  sites$ = of([]);
}

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SettingsComponent],
      imports: [ReactiveFormsModule, MatSnackBarModule],
      providers: [
        { provide: SettingsService, useClass: SettingsServiceStub },
        { provide: SiteService, useClass: SiteServiceStub },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
