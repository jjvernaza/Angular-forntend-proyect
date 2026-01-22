import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BuscarClienteComponent } from './buscar-cliente.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

describe('BuscarClienteComponent', () => {
  let component: BuscarClienteComponent;
  let fixture: ComponentFixture<BuscarClienteComponent>;

  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', [
      'getClientes',
      'getTiposServicio',
      'getEstados',
      'getPlanes',
      'getSectores',
      'getTarifas',
      'updateCliente',
      'deleteCliente'
    ]);

    authSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'hasAnyPermission',
      'hasPermission'
    ]);

    // defaults
    authSpy.hasAnyPermission.and.returnValue(false);
    authSpy.hasPermission.and.returnValue(false);

    apiSpy.getClientes.and.returnValue(of([] as any));
    apiSpy.getTiposServicio.and.returnValue(of([] as any));
    apiSpy.getEstados.and.returnValue(of([] as any));
    apiSpy.getPlanes.and.returnValue(of([] as any));
    apiSpy.getSectores.and.returnValue(of([] as any));
    apiSpy.getTarifas.and.returnValue(of([] as any));
    apiSpy.updateCliente.and.returnValue(of({} as any));
    apiSpy.deleteCliente.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [BuscarClienteComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BuscarClienteComponent);
    component = fixture.componentInstance;
  });

  function setPermisos({
    leer = true,
    actualizar = true,
    eliminar = true
  } = {}) {
    authSpy.hasAnyPermission.and.returnValue(leer);
    authSpy.hasPermission.and.callFake((p: string) => {
      if (p === 'clientes.actualizar') return actualizar;
      if (p === 'clientes.eliminar') return eliminar;
      return false;
    });
  }

  function initWithPermisos(p: { leer?: boolean; actualizar?: boolean; eliminar?: boolean } = {}) {
    setPermisos({
      leer: p.leer ?? true,
      actualizar: p.actualizar ?? true,
      eliminar: p.eliminar ?? true
    });
    component.ngOnInit();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit: sin permiso leer -> no carga nada', () => {
    setPermisos({ leer: false });

    component.ngOnInit();

    expect(apiSpy.getClientes).not.toHaveBeenCalled();
    expect(apiSpy.getTiposServicio).not.toHaveBeenCalled();
    expect(apiSpy.getEstados).not.toHaveBeenCalled();
    expect(apiSpy.getPlanes).not.toHaveBeenCalled();
    expect(apiSpy.getSectores).not.toHaveBeenCalled();
    expect(apiSpy.getTarifas).not.toHaveBeenCalled();
  });

  it('ngOnInit: con permiso leer -> carga clientes y catálogos', () => {
    setPermisos({ leer: true });

    component.ngOnInit();

    expect(apiSpy.getClientes).toHaveBeenCalled();
    expect(apiSpy.getTiposServicio).toHaveBeenCalled();
    expect(apiSpy.getEstados).toHaveBeenCalled();
    expect(apiSpy.getPlanes).toHaveBeenCalled();
    expect(apiSpy.getSectores).toHaveBeenCalled();
    expect(apiSpy.getTarifas).toHaveBeenCalled();
  });

  it('cargarClientes: sin permiso -> no llama API', () => {
    component.tienePermisoLeer = false;

    component.cargarClientes();

    expect(apiSpy.getClientes).not.toHaveBeenCalled();
  });

  it('cargarClientes: éxito -> setea clientes y clientesSinFiltrar', () => {
    component.tienePermisoLeer = true;

    const data = [{ ID: 1 }, { ID: 2 }];
    apiSpy.getClientes.and.returnValue(of(data as any));

    component.cargarClientes();

    expect(component.clientesSinFiltrar.length).toBe(2);
    expect(component.clientes.length).toBe(2);
  });

  it('buscarClientes: sin permiso -> alerta', () => {
    component.tienePermisoLeer = false;
    spyOn(window, 'alert');

    component.buscarClientes();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para buscar clientes.');
  });

  it('buscarClientes: filtra por nombre/apellido/teléfono/ubicación/cedula/id', () => {
    component.tienePermisoLeer = true;

    component.clientesSinFiltrar = [
      {
        ID: 10,
        NombreCliente: 'Juan',
        ApellidoCliente: 'Pérez',
        Cedula: '123',
        Telefono: '300123',
        Ubicacion: 'Cali'
      },
      {
        ID: 11,
        NombreCliente: 'Ana',
        ApellidoCliente: 'Gómez',
        Cedula: '999',
        Telefono: '311000',
        Ubicacion: 'Bogotá'
      }
    ];

    // filtro por apellido + teléfono + ubicación parcial
    component.filtro = {
      id: '',
      nombre: '',
      apellido: 'pérez',
      cedula: '',
      telefono: '300',
      ubicacion: 'ca'
    };

    component.buscarClientes();

    expect(component.clientes.length).toBe(1);
    expect(component.clientes[0].ID).toBe(10);

    // filtro por ID exacto
    component.filtro = {
      id: '11',
      nombre: '',
      apellido: '',
      cedula: '',
      telefono: '',
      ubicacion: ''
    };

    component.buscarClientes();
    expect(component.clientes.length).toBe(1);
    expect(component.clientes[0].ID).toBe(11);

    // filtro por cédula exacta
    component.filtro = {
      id: '',
      nombre: '',
      apellido: '',
      cedula: '123',
      telefono: '',
      ubicacion: ''
    };

    component.buscarClientes();
    expect(component.clientes.length).toBe(1);
    expect(component.clientes[0].ID).toBe(10);
  });

  it('limpiarFiltros: resetea filtro y restaura clientes', () => {
    component.clientesSinFiltrar = [{ ID: 1 }, { ID: 2 }] as any;
    component.clientes = [{ ID: 1 }] as any;
    component.filtro.nombre = 'x';

    component.limpiarFiltros();

    expect(component.filtro).toEqual({
      id: '',
      nombre: '',
      apellido: '',
      cedula: '',
      telefono: '',
      ubicacion: ''
    });
    expect(component.clientes.length).toBe(2);
  });

  it('abrirModalEditar: sin permiso actualizar -> alerta y no abre', () => {
    component.tienePermisoActualizar = false;
    spyOn(window, 'alert');

    component.abrirModalEditar({ ID: 1 });

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para editar clientes.');
    expect(component.modalEditar).toBeFalse();
  });

  it('abrirModalEditar: con permiso -> setea clienteEdit y abre modal (mapea IDs y formatea fecha)', () => {
    component.tienePermisoActualizar = true;

    const cliente = {
      ID: 10,
      FechaInstalacion: '2026-01-15T00:00:00.000Z',
      plan: { id: 5 },
      tarifa: { id: 7 },
      sector: { id: 9 },
      estado: { ID: 2 },
      tipoServicio: { ID: 3 }
    };

    component.abrirModalEditar(cliente);

    expect(component.modalEditar).toBeTrue();
    expect(component.clienteEdit.ID).toBe(10);
    expect(component.clienteEdit.plan_mb_id).toBe(5);
    expect(component.clienteEdit.tarifa_id).toBe(7);
    expect(component.clienteEdit.sector_id).toBe(9);
    expect(component.clienteEdit.EstadoID).toBe(2);
    expect(component.clienteEdit.TipoServicioID).toBe(3);
    expect(component.clienteEdit.FechaInstalacion).toBe('2026-01-15');
  });

  it('guardarEdicion: sin permiso actualizar -> alerta y no llama update', () => {
    component.tienePermisoActualizar = false;
    component.clienteEdit = { ID: 10 };
    spyOn(window, 'alert');

    component.guardarEdicion();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para actualizar clientes.');
    expect(apiSpy.updateCliente).not.toHaveBeenCalled();
  });

  it('guardarEdicion: éxito -> llama updateCliente, cierra modal, recarga y alerta', () => {
    component.tienePermisoActualizar = true;
    component.modalEditar = true;

    spyOn(component, 'cargarClientes');
    spyOn(window, 'alert');

    component.clienteEdit = {
      ID: 10,
      plan_mb_id: undefined,
      tarifa_id: undefined,
      sector_id: undefined,
      EstadoID: undefined,
      TipoServicioID: undefined
    };

    apiSpy.updateCliente.and.returnValue(of({} as any));

    component.guardarEdicion();

    expect(apiSpy.updateCliente).toHaveBeenCalled();
    const args = apiSpy.updateCliente.calls.mostRecent().args;
    expect(args[0]).toBe(10);

    // valida que manda null si venían vacíos
    const payload = args[1] as any;
    expect(payload.plan_mb_id).toBeNull();
    expect(payload.tarifa_id).toBeNull();
    expect(payload.sector_id).toBeNull();
    expect(payload.EstadoID).toBeNull();
    expect(payload.TipoServicioID).toBeNull();

    expect(component.modalEditar).toBeFalse();
    expect(component.cargarClientes).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Cliente actualizado correctamente');
  });

  it('abrirModalEliminar: sin permiso -> alerta', () => {
    component.tienePermisoEliminar = false;
    spyOn(window, 'alert');

    component.abrirModalEliminar(10);

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para eliminar clientes.');
    expect(component.modalEliminar).toBeFalse();
  });

  it('abrirModalEliminar: id inválido -> alerta y no abre', () => {
    component.tienePermisoEliminar = true;
    spyOn(window, 'alert');

    component.abrirModalEliminar(0);

    expect(window.alert).toHaveBeenCalledWith('Error: ID de cliente inválido');
    expect(component.modalEliminar).toBeFalse();
  });

  it('abrirModalEliminar: ok -> setea id y abre modal', () => {
    component.tienePermisoEliminar = true;

    component.abrirModalEliminar(10);

    expect(component.clienteEliminarId).toBe(10);
    expect(component.modalEliminar).toBeTrue();
  });

  it('eliminarCliente: sin permiso -> alerta y no llama delete', () => {
    component.tienePermisoEliminar = false;
    component.clienteEliminarId = 10;
    spyOn(window, 'alert');

    component.eliminarCliente();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para eliminar clientes.');
    expect(apiSpy.deleteCliente).not.toHaveBeenCalled();
  });

  it('eliminarCliente: id inválido -> alerta y cierra modal', () => {
    component.tienePermisoEliminar = true;
    component.clienteEliminarId = 0;
    component.modalEliminar = true;
    spyOn(window, 'alert');

    component.eliminarCliente();

    expect(window.alert).toHaveBeenCalledWith('Error: ID de cliente no válido');
    expect(component.modalEliminar).toBeFalse();
    expect(apiSpy.deleteCliente).not.toHaveBeenCalled();
  });

  it('eliminarCliente: éxito -> llama deleteCliente, resetea y recarga', () => {
    component.tienePermisoEliminar = true;
    component.clienteEliminarId = 10;
    component.modalEliminar = true;

    spyOn(component, 'cargarClientes');
    spyOn(window, 'alert');

    apiSpy.deleteCliente.and.returnValue(of({} as any));

    component.eliminarCliente();

    expect(apiSpy.deleteCliente).toHaveBeenCalledWith(10);
    expect(component.modalEliminar).toBeFalse();
    expect(component.clienteEliminarId).toBeNull();
    expect(component.cargarClientes).toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith('Cliente eliminado correctamente');
  });

  it('helpers: getEstadoColorByName y getTextColorForBg', () => {
    expect(component.getEstadoColorByName('activo')).toBe('#22c55e');
    expect(component.getEstadoColorByName('inactivo')).toBe('#ef4444');
    expect(component.getEstadoColorByName('')).toBe('#6b7280');

    // blanco => texto negro
    expect(component.getTextColorForBg('#ffffff')).toBe('#000000');
    // negro => texto blanco
    expect(component.getTextColorForBg('#000000')).toBe('#ffffff');
    // vacío => default
    expect(component.getTextColorForBg('')).toBe('#000000');
  });

  it('mostrarMensajePermisos: muestra alerta con acción', () => {
    spyOn(window, 'alert');
    component.mostrarMensajePermisos('editar');
    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para editar clientes.');
  });
});
