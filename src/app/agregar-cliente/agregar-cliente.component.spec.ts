import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { AgregarClienteComponent } from './agregar-cliente.component';
import { ApiService } from '../services/api.service';
import { PlanService } from '../services/plan.service';
import { SectorService } from '../services/sector.service';
import { TarifaService } from '../services/tarifa.service';
import { AuthService } from '../services/auth.service';

describe('AgregarClienteComponent', () => {
  let component: AgregarClienteComponent;
  let fixture: ComponentFixture<AgregarClienteComponent>;

  let apiSpy: jasmine.SpyObj<ApiService>;
  let planSpy: jasmine.SpyObj<PlanService>;
  let sectorSpy: jasmine.SpyObj<SectorService>;
  let tarifaSpy: jasmine.SpyObj<TarifaService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getEstados',
      'getTiposServicio',
      'addCliente'
    ]);
    planSpy = jasmine.createSpyObj<PlanService>('PlanService', ['getAllPlanes']);
    sectorSpy = jasmine.createSpyObj<SectorService>('SectorService', ['getAllSectores']);
    tarifaSpy = jasmine.createSpyObj<TarifaService>('TarifaService', ['getAllTarifas']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission', 'getUserPermissions']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    // Defaults para que cargarDatos() no explote
    apiSpy.getEstados.and.returnValue(of([] as any));
    apiSpy.getTiposServicio.and.returnValue(of([] as any));
    planSpy.getAllPlanes.and.returnValue(of([] as any));
    sectorSpy.getAllSectores.and.returnValue(of([] as any));
    tarifaSpy.getAllTarifas.and.returnValue(of([] as any));

    // Default: sin permiso (lo sobreescribimos en los tests que lo necesiten)
    authSpy.hasPermission.and.returnValue(false);
    authSpy.getUserPermissions.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [AgregarClienteComponent, ReactiveFormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: PlanService, useValue: planSpy },
        { provide: SectorService, useValue: sectorSpy },
        { provide: TarifaService, useValue: tarifaSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AgregarClienteComponent);
    component = fixture.componentInstance;
  });

  function allowPermission() {
    authSpy.hasPermission.and.returnValue(true);
    authSpy.getUserPermissions.and.returnValue(['clientes.crear']);
  }

  function initWithPermission() {
    allowPermission();
    component.ngOnInit();
  }

  function fillValidForm() {
    // el form existe porque usamos initWithPermission()
    component.clienteForm.setValue({
      NombreCliente: 'Juan',
      ApellidoCliente: 'V',
      plan_mb_id: '1',          // string a propósito para probar parseInt
      FechaInstalacion: '2026-01-01',
      EstadoID: '2',
      tarifa_id: '3',
      sector_id: '4',
      IPAddress: '192.168.0.10',
      Telefono: '3001234567',
      Ubicacion: 'Cali',
      Cedula: '123456',
      TipoServicioID: '5'
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit: sin permiso -> setea mensaje error y NO carga datos', () => {
    // default ya es false por beforeEach
    component.ngOnInit();

    expect(component.tienePermiso).toBeFalse();
    expect(component.tipoMensaje).toBe('error');
    expect(component.mensaje).toContain('No tienes permisos');

    expect(apiSpy.getEstados).not.toHaveBeenCalled();
    expect(apiSpy.getTiposServicio).not.toHaveBeenCalled();
    expect(planSpy.getAllPlanes).not.toHaveBeenCalled();
    expect(sectorSpy.getAllSectores).not.toHaveBeenCalled();
    expect(tarifaSpy.getAllTarifas).not.toHaveBeenCalled();
  });

  it('ngOnInit: con permiso -> inicializa form y carga datos', () => {
    initWithPermission();

    expect(component.tienePermiso).toBeTrue();
    expect(component.clienteForm).toBeTruthy();

    expect(apiSpy.getEstados).toHaveBeenCalled();
    expect(apiSpy.getTiposServicio).toHaveBeenCalled();
    expect(planSpy.getAllPlanes).toHaveBeenCalled();
    expect(sectorSpy.getAllSectores).toHaveBeenCalled();
    expect(tarifaSpy.getAllTarifas).toHaveBeenCalled();
  });

  it('agregarCliente: sin permiso -> muestra modal y mensaje', () => {
    component.tienePermiso = false;

    component.agregarCliente();

    expect(component.tipoMensaje).toBe('error');
    expect(component.mensaje).toContain('No tienes permisos');
    expect(component.mostrarModal).toBeTrue();
    expect(apiSpy.addCliente).not.toHaveBeenCalled();
  });

  it('agregarCliente: form inválido -> marca campos touched y muestra modal', () => {
    initWithPermission();

    // form vacío => inválido
    component.agregarCliente();

    expect(component.mostrarModal).toBeTrue();
    expect(component.tipoMensaje).toBe('error');
    expect(component.mensaje).toContain('complete todos los campos');

    expect(component.clienteForm.get('NombreCliente')?.touched).toBeTrue();
  });

  it('agregarCliente: form válido -> llama addCliente con IDs numéricos y muestra success', () => {
    initWithPermission();
    fillValidForm();

    apiSpy.addCliente.and.returnValue(of({ ok: true } as any));

    component.agregarCliente();

    expect(apiSpy.addCliente).toHaveBeenCalled();

    expect(component.isSubmitting).toBeFalse();
    expect(component.tipoMensaje).toBe('success');
    expect(component.mensaje).toBe('Cliente agregado correctamente');
    expect(component.mostrarModal).toBeTrue();

    const sent = apiSpy.addCliente.calls.mostRecent().args[0];
    expect(sent.EstadoID).toBe(2);
    expect(sent.TipoServicioID).toBe(5);
    expect(sent.plan_mb_id).toBe(1);
    expect(sent.sector_id).toBe(4);
    expect(sent.tarifa_id).toBe(3);
  });

  it('agregarCliente: backend error -> muestra mensaje error y modal', () => {
    initWithPermission();
    fillValidForm();

    apiSpy.addCliente.and.returnValue(
      throwError(() => ({ error: { message: 'Error backend' } }))
    );

    component.agregarCliente();

    expect(component.isSubmitting).toBeFalse();
    expect(component.tipoMensaje).toBe('error');
    expect(component.mensaje).toBe('Error backend');
    expect(component.mostrarModal).toBeTrue();
  });

  it('cerrarModal: oculta el modal', () => {
    component.mostrarModal = true;
    component.cerrarModal();
    expect(component.mostrarModal).toBeFalse();
  });
});
