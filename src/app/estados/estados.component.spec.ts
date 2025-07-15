import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EstadosComponent } from './estados.component';
import { ApiService } from '../services/api.service';

describe('EstadosComponent', () => {
  let component: EstadosComponent;
  let fixture: ComponentFixture<EstadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstadosComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(EstadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});