import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockMovement } from './stock-movement';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('StockMovement', () => {
  let component: StockMovement;
  let fixture: ComponentFixture<StockMovement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockMovement],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(StockMovement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
