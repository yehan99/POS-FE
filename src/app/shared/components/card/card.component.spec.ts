import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default variant', () => {
    expect(component.variant).toBe('default');
  });

  it('should have medium padding by default', () => {
    expect(component.padding).toBe('medium');
  });

  it('should not be hoverable by default', () => {
    expect(component.hoverable).toBeFalsy();
  });

  it('should not be clickable by default', () => {
    expect(component.clickable).toBeFalsy();
  });
});
