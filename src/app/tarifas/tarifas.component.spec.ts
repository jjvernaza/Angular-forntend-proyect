import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TarifasComponent } from './tarifas.component';
import { TarifaService } from '../services/tarifa.service';

describe('TarifasComponent', () => {
  let component: TarifasComponent;
  let fixture: ComponentFixture<TarifasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarifasComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [TarifaService]
    }).compileComponents();

    fixture = TestBed.createComponent(TarifasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});