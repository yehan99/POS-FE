import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of } from 'rxjs';

import { StockTransfersComponent } from './stock-transfers.component';
import { InventoryService } from '../services/inventory.service';

describe('StockTransfersComponent', () => {
  let component: StockTransfersComponent;
  let fixture: ComponentFixture<StockTransfersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StockTransfersComponent],
      imports: [
        ReactiveFormsModule,
        BrowserAnimationsModule,
        MatSnackBarModule,
      ],
      providers: [
        {
          provide: InventoryService,
          useValue: {
            getLocations: () => of([]),
            getStockTransferDashboardMetrics: () =>
              of({
                totalTransfers: 0,
                pendingApproval: 0,
                inTransit: 0,
                completed: 0,
                cancelled: 0,
                totalItemsMoved: 0,
                totalValueMoved: 0,
                statusBreakdown: [],
                trend: [],
                topLocations: [],
              }),
            getStockTransfers: () =>
              of({
                data: [],
                pagination: {
                  page: 1,
                  limit: 10,
                  total: 0,
                  totalPages: 0,
                  hasNext: false,
                  hasPrev: false,
                },
              }),
            exportStockTransfers: () => of(new Blob()),
            approveStockTransfer: () => of(null),
            shipStockTransfer: () => of(null),
            getStockTransferById: () =>
              of({
                id: '1',
                transferNumber: 'ST-001',
                fromLocationId: 'A',
                fromLocationName: 'From',
                toLocationId: 'B',
                toLocationName: 'To',
                status: 'pending',
                totalItems: 0,
                totalValue: 0,
                requestedBy: 'Tester',
                items: [],
                createdAt: new Date().toISOString(),
              }),
            receiveStockTransfer: () => of(null),
            cancelStockTransfer: () => of(null),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(StockTransfersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
