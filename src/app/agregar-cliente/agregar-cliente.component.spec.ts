import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router'; // ← Agregar ActivatedRoute
import { AgregarClienteComponent } from './agregar-cliente.component';
import { ApiService } from '../services/api.service';
import { of } from 'rxjs'; // ← Agregar of

describe('AgregarClienteComponent', () => {
  let component: AgregarClienteComponent;
  let fixture: ComponentFixture<AgregarClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarClienteComponent, HttpClientTestingModule],
      providers: [
        ApiService,
        // ← Agregar este provider
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: { params: {} },
            queryParams: of({}),
            fragment: of(''),
            data: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});