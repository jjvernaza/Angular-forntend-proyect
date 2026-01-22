import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AgregarPagoComponent } from './agregar-pago.component';

import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { MetodoPagoService } from '../services/metodo-pago.service';
import { FacturaService } from '../services/factura.service';

describe('AgregarPagoComponent', () => {
  let component: AgregarPagoComponent;
  let fixture: ComponentFixture<AgregarPagoComponent>;

  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let metodoSpy: jasmine.SpyObj<MetodoPagoService>;
  let facturaSpy: jasmine.SpyObj<FacturaService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getClientes',
      'getPagosCliente',
      'addPago',
      'getTarifaByClienteId'
    ]);

    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission']);

    metodoSpy = jasmine.createSpyObj<MetodoPagoService>('MetodoPagoService', ['getAllMetodosPago']);

    facturaSpy = jasmine.createSpyObj<FacturaService>('FacturaService', [
      'generarFacturaPorPagar',
      'generarFacturaPagada'
    ]);

    // defaults
    authSpy.hasPermission.and.returnValue(false);
    metodoSpy.getAllMetodosPago.and.returnValue(of([] as any));

    await TestBed.configureTestingModule({
      imports: [AgregarPagoComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: MetodoPagoService, useValue: metodoSpy },
        { provide: FacturaService, useValue: facturaSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarPagoComponent);
    component = fixture.componentInstance;
  });

  function allowPermisos({ leer = true, crear = true } = {}) {
    authSpy.hasPermission.and.callFake((p: string) => {
      if (p === 'pagos.leer') return leer;
      if (p === 'pagos.crear') return crear;
      return false;
    });
  }

  function initWithPermisos({ leer = true, crear = true } = {}) {
    allowPermisos({ leer, crear });
    component.ngOnInit();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit: sin permisos -> no inicializa formulario', () => {
    allowPermisos({ leer: false, crear: false });

    component.ngOnInit();

    expect(component.tienePermisoLeer).toBeFalse();
    expect(component.tienePermisoCrear).toBeFalse();
    expect(component.pagoForm).toBeUndefined();
    expect(metodoSpy.getAllMetodosPago).not.toHaveBeenCalled();
  });

  it('ngOnInit: con permisos -> inicializa formulario, carga metodos y setea fecha/mes/año', () => {
    allowPermisos({ leer: true, crear: false });
    metodoSpy.getAllMetodosPago.and.returnValue(of([{ ID: 1, Metodo: 'Efectivo' }] as any));

    component.ngOnInit();

    expect(component.pagoForm).toBeTruthy();
    expect(metodoSpy.getAllMetodosPago).toHaveBeenCalled();
    expect(component.metodosPago.length).toBe(1);

    // Debe tener FechaPago/Mes/Ano seteados
    const v = component.pagoForm.value;
    expect(v.FechaPago).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(component.mesesDelAnio).toContain(v.Mes);
    expect(typeof v.Ano).toBe('number');
  });

  it('buscarCliente: sin permiso leer -> alerta y no consulta API', () => {
    component.tienePermisoLeer = false;
    spyOn(window, 'alert');

    component.terminoBusqueda = 'juan';
    component.buscarCliente();

    expect(window.alert).toHaveBeenCalled();
    expect(apiSpy.getClientes).not.toHaveBeenCalled();
  });

  it('buscarCliente: encuentra cliente, setea clienteSeleccionado, carga pagos y años', fakeAsync(() => {
    initWithPermisos({ leer: true, crear: true });

    const clientesMock = [
      {
        ID: 10,
        NombreCliente: 'Juan',
        ApellidoCliente: 'V',
        Cedula: '123',
        Telefono: '300',
        tarifa: { valor: 50000 }
      }
    ];

    const pagosMock = [
      { Ano: 2025, FechaPago: '2025-02-01' },
      { Ano: 2024, FechaPago: '2024-12-15' },
      { Ano: 2025, FechaPago: '2025-03-01' },
    ];

    apiSpy.getClientes.and.returnValue(of(clientesMock as any));
    apiSpy.getPagosCliente.and.returnValue(of(pagosMock as any));

    component.terminoBusqueda = 'juan';
    component.buscarCliente();
    tick();

    expect(component.clienteSeleccionado?.ID).toBe(10);
    expect(component.pagoForm.value.ClienteID).toBe(10);
    expect(component.pagoForm.value.Monto).toBe(50000);

    expect(apiSpy.getPagosCliente).toHaveBeenCalledWith(10);

    // años únicos ordenados
    expect(component.aniosDisponibles).toEqual([2024, 2025]);

    // pagos filtrados deben estar ordenados desc por fecha
    expect(component.pagosFiltrados[0].FechaPago).toBe('2025-03-01');
  }));

  it('filtrarPagos: filtra por año y ordena por fecha desc', () => {
    component.pagosCliente = [
      { Ano: 2024, FechaPago: '2024-01-01' },
      { Ano: 2025, FechaPago: '2025-01-01' },
      { Ano: 2025, FechaPago: '2025-03-01' },
    ];

    component.filtroAnio = '2025';
    component.filtrarPagos();

    expect(component.pagosFiltrados.length).toBe(2);
    expect(component.pagosFiltrados[0].FechaPago).toBe('2025-03-01');
  });

  it('agregarPago: sin permiso crear -> alerta y no llama API', () => {
    component.tienePermisoCrear = false;
    spyOn(window, 'alert');

    component.agregarPago();

    expect(window.alert).toHaveBeenCalled();
    expect(apiSpy.addPago).not.toHaveBeenCalled();
  });

  it('agregarPago: válido -> llama addPago, recarga pagos y genera factura si viene payment', fakeAsync(() => {
    initWithPermisos({ leer: true, crear: true });

    component.clienteSeleccionado = {
      ID: 10,
      tarifa: { valor: 50000 }
    };

    component.pagoForm.patchValue({
      ClienteID: 10,
      FechaPago: '2026-01-01',
      Mes: 'ENERO',
      Ano: 2026,
      Monto: 50000,
      Metodo_de_PagoID: '2' // string para probar parseInt
    });

    apiSpy.addPago.and.returnValue(of({ payment: { ID: 999 } } as any));
    apiSpy.getPagosCliente.and.returnValue(of([{ Ano: 2026, FechaPago: '2026-01-01' }] as any));

    spyOn(component, 'generarFacturaPagada');

    component.agregarPago();
    tick();

    // addPago con Metodo_de_PagoID numérico
    const sent = apiSpy.addPago.calls.mostRecent().args[0];
    expect(sent.Metodo_de_PagoID).toBe(2);

    expect(component.mensajeExito).toBeTrue();
    expect(component.mensajeError).toBeFalse();
    expect(component.isSubmitting).toBeFalse();

    expect(apiSpy.getPagosCliente).toHaveBeenCalledWith(10);
    expect(component.generarFacturaPagada).toHaveBeenCalled();

    tick(3000);
    expect(component.mensajeExito).toBeFalse();
  }));

  it('agregarPago: error backend -> setea errorMessage y mensajeError', fakeAsync(() => {
    initWithPermisos({ leer: true, crear: true });

    component.clienteSeleccionado = { ID: 10, tarifa: { valor: 50000 } };

    component.pagoForm.patchValue({
      ClienteID: 10,
      FechaPago: '2026-01-01',
      Mes: 'ENERO',
      Ano: 2026,
      Monto: 50000,
      Metodo_de_PagoID: '2'
    });

    apiSpy.addPago.and.returnValue(
      throwError(() => ({ error: { message: 'Fallo al guardar' } }))
    );

    component.agregarPago();
    tick();

    expect(component.mensajeExito).toBeFalse();
    expect(component.mensajeError).toBeTrue();
    expect(component.errorMessage).toBe('Fallo al guardar');
    expect(component.isSubmitting).toBeFalse();

    tick(3000);
    expect(component.mensajeError).toBeFalse();
  }));

  it('generarFacturaPagada: con tarifa en cliente -> llama FacturaService', () => {
    component.tienePermisoLeer = true;
    const cliente = { ID: 10, tarifa: { valor: 50000 } };
    const pago = { ID: 1 };

    component.generarFacturaPagada(cliente, pago);

    expect(facturaSpy.generarFacturaPagada).toHaveBeenCalledWith(cliente, pago, cliente.tarifa);
  });

  it('abrir/cerrarSelectorMeses', () => {
    component.mostrarSelectorMeses = false;
    component.abrirSelectorMeses();
    expect(component.mostrarSelectorMeses).toBeTrue();

    component.cerrarSelectorMeses();
    expect(component.mostrarSelectorMeses).toBeFalse();
  });
});
