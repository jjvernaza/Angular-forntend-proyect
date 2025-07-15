import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AgregarPagoComponent } from './agregar-pago.component';
import { ApiService } from '../services/api.service';

describe('AgregarPagoComponent', () => {
  let component: AgregarPagoComponent;
  let fixture: ComponentFixture<AgregarPagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarPagoComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});