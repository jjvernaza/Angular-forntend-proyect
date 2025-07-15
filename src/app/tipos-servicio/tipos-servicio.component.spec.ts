import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TiposServicioComponent } from './tipos-servicio.component';
import { ApiService } from '../services/api.service';

describe('TiposServicioComponent', () => {
  let component: TiposServicioComponent;
  let fixture: ComponentFixture<TiposServicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiposServicioComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [ApiService]
    }).compileComponents();

    fixture = TestBed.createComponent(TiposServicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});