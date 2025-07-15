import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MorososComponent } from './morosos.component';
import { ApiService } from '../services/api.service';
import { FacturaService } from '../services/factura.service';

describe('MorososComponent', () => {
  let component: MorososComponent;
  let fixture: ComponentFixture<MorososComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MorososComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [ApiService, FacturaService]
    }).compileComponents();

    fixture = TestBed.createComponent(MorososComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});