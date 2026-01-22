// src/app/morosos/morosos.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MorososComponent } from './morosos.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

describe('MorososComponent', () => {
  let component: MorososComponent;
  let fixture: ComponentFixture<MorososComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockMorosos = [
    { ClienteID: 1, Nombre: 'Juan Pérez', MontoDeuda: 150000, MesesDeuda: 3 },
    { ClienteID: 2, Nombre: 'María López', MontoDeuda: 200000, MesesDeuda: 5 }
  ];

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getMorososPorMeses',
      'exportClientsMorososToExcel'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [MorososComponent],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MorososComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit → debería cargar morosos si tiene permisos', () => {
    authServiceSpy.hasPermission.and.returnValue(true);
    apiServiceSpy.getMorososPorMeses.and.returnValue(of(mockMorosos));

    fixture.detectChanges(); // Ejecuta ngOnInit

    expect(component.tienePermiso).toBeTrue();
    expect(apiServiceSpy.getMorososPorMeses).toHaveBeenCalledWith(3);
    expect(component.morosos.length).toBe(2);
  });

  it('ngOnInit → NO debería cargar morosos si no tiene permisos', () => {
    authServiceSpy.hasPermission.and.returnValue(false);

    fixture.detectChanges();

    expect(component.tienePermiso).toBeFalse();
    expect(apiServiceSpy.getMorososPorMeses).not.toHaveBeenCalled();
  });

  it('cargarMorosos → debería calcular estadísticas correctamente', fakeAsync(() => {
    component.tienePermiso = true;
    apiServiceSpy.getMorososPorMeses.and.returnValue(of(mockMorosos));

    component.cargarMorosos();
    tick(); // Espera a que se complete el observable

    expect(component.totalDeuda).toBe(350000);
    expect(component.promedioMesesDeuda).toBe(4);
  }));

  it('cargarMorosos → debería manejar errores', fakeAsync(() => {
    component.tienePermiso = true;
    apiServiceSpy.getMorososPorMeses.and.returnValue(
      throwError(() => new Error('Error de red'))
    );
    spyOn(window, 'alert');

    component.cargarMorosos();
    tick();

    expect(component.isLoading).toBeFalse();
    expect(window.alert).toHaveBeenCalledWith(
      'Error al cargar clientes morosos. Por favor, intente nuevamente.'
    );
  }));

  it('registrarPago → debería navegar con clienteId si tiene permisos', () => {
    component.tienePermiso = true;

    component.registrarPago(123);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/agregar-pago'],
      { queryParams: { clienteId: 123 } }
    );
  });

  it('registrarPago → NO debería navegar si no tiene permisos', () => {
    component.tienePermiso = false;
    spyOn(window, 'alert');

    component.registrarPago(123);

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para registrar pagos.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('downloadMorososExcel → debería descargar archivo si tiene permisos', fakeAsync(() => {
    component.tienePermiso = true;
    const mockBlob = new Blob(['test'], { type: 'application/vnd.ms-excel' });
    apiServiceSpy.exportClientsMorososToExcel.and.returnValue(of(mockBlob));
    
    // Mock completo del elemento link
    const mockLink = document.createElement('a');
    spyOn(mockLink, 'click');
    spyOn(document, 'createElement').and.returnValue(mockLink);
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock-url');
    spyOn(window.URL, 'revokeObjectURL');

    component.downloadMorososExcel();
    tick();

    expect(apiServiceSpy.exportClientsMorososToExcel).toHaveBeenCalledWith(3);
    expect(mockLink.click).toHaveBeenCalled();
  }));

  it('downloadMorososExcel → NO debería descargar si no tiene permisos', () => {
    component.tienePermiso = false;
    spyOn(window, 'alert');

    component.downloadMorososExcel();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para descargar reportes.');
    expect(apiServiceSpy.exportClientsMorososToExcel).not.toHaveBeenCalled();
  });

  it('calcularEstadisticas → debería manejar array vacío', () => {
    component.morosos = [];

    component.calcularEstadisticas();

    expect(component.totalDeuda).toBe(0);
    expect(component.promedioMesesDeuda).toBe(0);
  });
});