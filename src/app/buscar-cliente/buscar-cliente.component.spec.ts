import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BuscarClienteComponent } from './buscar-cliente.component';
import { ApiService } from '../services/api.service';

describe('BuscarClienteComponent', () => {
  let component: BuscarClienteComponent;
  let fixture: ComponentFixture<BuscarClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscarClienteComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(BuscarClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});