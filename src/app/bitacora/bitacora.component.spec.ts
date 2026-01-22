import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { BitacoraComponent } from './bitacora.component';
import { BitacoraService } from '../services/bitacora.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

describe('BitacoraComponent', () => {
  let component: BitacoraComponent;
  let fixture: ComponentFixture<BitacoraComponent>;

  let bitacoraSpy: jasmine.SpyObj<BitacoraService>;
  let userSpy: jasmine.SpyObj<UserService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    bitacoraSpy = jasmine.createSpyObj<BitacoraService>('BitacoraService', [
      'getAllBitacora',
      'getModulos',
      'getAcciones',
      'exportarBitacora',
      'getEstadisticas'
    ]);

    userSpy = jasmine.createSpyObj<UserService>('UserService', ['getAllUsers']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission']);

    // defaults
    userSpy.getAllUsers.and.returnValue(of([] as any));
    bitacoraSpy.getModulos.and.returnValue(of([] as any));
    bitacoraSpy.getAcciones.and.returnValue(of([] as any));
    bitacoraSpy.getAllBitacora.and.returnValue(of({ registros: [], total: 0 } as any));
    bitacoraSpy.exportarBitacora.and.returnValue(of(new Blob([]) as any));
    bitacoraSpy.getEstadisticas.and.returnValue(of({} as any));

    authSpy.hasPermission.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [BitacoraComponent],
      providers: [
        { provide: BitacoraService, useValue: bitacoraSpy },
        { provide: UserService, useValue: userSpy },
        { provide: AuthService, useValue: authSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BitacoraComponent);
    component = fixture.componentInstance;
  });

  function mockPermisos({ leer = true, exportar = true, estadisticas = true } = {}) {
    authSpy.hasPermission.and.callFake((p: string) => {
      if (p === 'bitacora.leer') return leer;
      if (p === 'bitacora.exportar') return exportar;
      if (p === 'bitacora.estadisticas') return estadisticas;
      return false;
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit: sin permiso leer -> no carga datos ni registros', () => {
    mockPermisos({ leer: false });

    component.ngOnInit();

    expect(userSpy.getAllUsers).not.toHaveBeenCalled();
    expect(bitacoraSpy.getModulos).not.toHaveBeenCalled();
    expect(bitacoraSpy.getAcciones).not.toHaveBeenCalled();
    expect(bitacoraSpy.getAllBitacora).not.toHaveBeenCalled();
  });

  it('ngOnInit: con permiso leer -> carga datos y registros', () => {
    mockPermisos({ leer: true, exportar: false, estadisticas: false });

    component.ngOnInit();

    expect(userSpy.getAllUsers).toHaveBeenCalled();
    expect(bitacoraSpy.getModulos).toHaveBeenCalled();
    expect(bitacoraSpy.getAcciones).toHaveBeenCalled();
    expect(bitacoraSpy.getAllBitacora).toHaveBeenCalled();
  });

  it('cargarRegistros: construye filtros y setea registros/total/paginación', () => {
    mockPermisos({ leer: true });

    component.filtroUsuario = '10';
    component.filtroModulo = 'CLIENTES';
    component.filtroAccion = 'CREAR';
    component.filtroFechaInicio = '2026-01-01';
    component.filtroFechaFin = '2026-01-31';
    component.filtroBusqueda = 'juan';
    component.limit = 50;
    component.offset = 0;

    bitacoraSpy.getAllBitacora.and.returnValue(of({
      registros: [{ id: 1 }, { id: 2 }],
      total: 120
    } as any));

    component.cargarRegistros();

    // ✅ Fix TS strict: primero verifico que se llamó, luego tomo args casteado
    expect(bitacoraSpy.getAllBitacora).toHaveBeenCalled();
    const call = bitacoraSpy.getAllBitacora.calls.mostRecent();
    const filtrosEnviados = call.args[0] as any;

    expect(filtrosEnviados.usuario_id).toBe(10);
    expect(filtrosEnviados.modulo).toBe('CLIENTES');
    expect(filtrosEnviados.accion).toBe('CREAR');
    expect(filtrosEnviados.fecha_inicio).toBe('2026-01-01');
    expect(filtrosEnviados.fecha_fin).toBe('2026-01-31');
    expect(filtrosEnviados.busqueda).toBe('juan');
    expect(filtrosEnviados.limit).toBe(50);
    expect(filtrosEnviados.offset).toBe(0);

    expect(component.registros.length).toBe(2);
    expect(component.total).toBe(120);
    expect(component.totalPaginas).toBe(3); // 120/50 => 2.4 => 3
    expect(component.isLoading).toBeFalse();
  });

  it('cargarRegistros: error -> setea errorMessage y isLoading false', () => {
    mockPermisos({ leer: true });

    bitacoraSpy.getAllBitacora.and.returnValue(
      throwError(() => ({ error: { message: 'fallo' } }))
    );

    component.cargarRegistros();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Error al cargar registros de bitácora');
  });

  it('aplicarFiltros: resetea paginación y llama cargarRegistros', () => {
    spyOn(component, 'cargarRegistros');
    component.offset = 200;
    component.paginaActual = 4;

    component.aplicarFiltros();

    expect(component.offset).toBe(0);
    expect(component.paginaActual).toBe(1);
    expect(component.cargarRegistros).toHaveBeenCalled();
  });

  it('limpiarFiltros: limpia filtros y aplica', () => {
    spyOn(component, 'aplicarFiltros');

    component.filtroUsuario = '1';
    component.filtroModulo = 'X';
    component.filtroAccion = 'Y';
    component.filtroFechaInicio = '2026-01-01';
    component.filtroFechaFin = '2026-01-02';
    component.filtroBusqueda = 'abc';

    component.limpiarFiltros();

    expect(component.filtroUsuario).toBe('');
    expect(component.filtroModulo).toBe('');
    expect(component.filtroAccion).toBe('');
    expect(component.filtroFechaInicio).toBe('');
    expect(component.filtroFechaFin).toBe('');
    expect(component.filtroBusqueda).toBe('');
    expect(component.aplicarFiltros).toHaveBeenCalled();
  });

  it('cambiarPagina: no hace nada si está fuera de rango', () => {
    spyOn(component, 'cargarRegistros');
    component.totalPaginas = 3;

    component.cambiarPagina(0);
    component.cambiarPagina(4);

    expect(component.cargarRegistros).not.toHaveBeenCalled();
  });

  it('cambiarPagina: actualiza offset/pagina y carga registros', () => {
    spyOn(component, 'cargarRegistros');
    component.totalPaginas = 5;
    component.limit = 50;

    component.cambiarPagina(3);

    expect(component.paginaActual).toBe(3);
    expect(component.offset).toBe(100);
    expect(component.cargarRegistros).toHaveBeenCalled();
  });

  it('verDetalle / cerrarModal', () => {
    const reg = { id: 1 };

    component.verDetalle(reg);
    expect(component.mostrarModalDetalle).toBeTrue();
    expect(component.registroSeleccionado).toEqual(reg);

    component.cerrarModal();
    expect(component.mostrarModalDetalle).toBeFalse();
    expect(component.registroSeleccionado).toBeNull();
  });

  it('exportarExcel: sin permiso -> alerta y no exporta', () => {
    component.tienePermisoExportar = false;
    spyOn(window, 'alert');

    component.exportarExcel();

    expect(window.alert).toHaveBeenCalled();
    expect(bitacoraSpy.exportarBitacora).not.toHaveBeenCalled();
  });

  it('exportarExcel: con permiso -> llama servicio, setea successMessage y lo limpia', fakeAsync(() => {
    component.tienePermisoExportar = true;

    // mocks descarga
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:mock');
    spyOn(window.URL, 'revokeObjectURL');

    const linkMock = document.createElement('a');
    spyOn(linkMock, 'click');
    spyOn(document, 'createElement').and.returnValue(linkMock);

    bitacoraSpy.exportarBitacora.and.returnValue(of(new Blob(['x']) as any));

    component.exportarExcel();
    tick();

    expect(bitacoraSpy.exportarBitacora).toHaveBeenCalled();
    expect(component.successMessage).toBe('Bitácora exportada exitosamente');
    expect(component.isExporting).toBeFalse();
    expect(linkMock.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();

    tick(3000);
    expect(component.successMessage).toBe('');
  }));

  it('exportarExcel: error -> setea errorMessage', () => {
    component.tienePermisoExportar = true;
    bitacoraSpy.exportarBitacora.and.returnValue(
      throwError(() => ({ error: { message: 'fallo export' } }))
    );

    component.exportarExcel();

    expect(component.isExporting).toBeFalse();
    expect(component.errorMessage).toBe('Error al exportar la bitácora');
  });

  it('cargarEstadisticas: sin permiso -> alerta y no llama API', () => {
    component.tienePermisoEstadisticas = false;
    spyOn(window, 'alert');

    component.cargarEstadisticas();

    expect(window.alert).toHaveBeenCalled();
    expect(bitacoraSpy.getEstadisticas).not.toHaveBeenCalled();
  });

  it('cargarEstadisticas: con permiso -> setea estadisticas', () => {
    component.tienePermisoEstadisticas = true;
    bitacoraSpy.getEstadisticas.and.returnValue(of({ total: 5 } as any));

    component.cargarEstadisticas();

    expect(component.mostrarEstadisticas).toBeTrue();
    expect(component.isLoadingEstadisticas).toBeFalse();
    expect(component.estadisticas).toEqual({ total: 5 } as any);
  });

  it('cargarEstadisticas: error -> setea errorMessage', () => {
    component.tienePermisoEstadisticas = true;
    bitacoraSpy.getEstadisticas.and.returnValue(
      throwError(() => ({ error: { message: 'fallo stats' } }))
    );

    component.cargarEstadisticas();

    expect(component.isLoadingEstadisticas).toBeFalse();
    expect(component.errorMessage).toBe('Error al cargar estadísticas');
  });

  it('cerrarEstadisticas: resetea flag y data', () => {
    component.mostrarEstadisticas = true;
    component.estadisticas = { x: 1 };

    component.cerrarEstadisticas();

    expect(component.mostrarEstadisticas).toBeFalse();
    expect(component.estadisticas).toBeNull();
  });

  it('getNombreUsuario: devuelve nombre o "Desconocido"', () => {
    component.usuarios = [{ ID: 1, Nombre: 'Juan', Apellidos: 'V' }];

    expect(component.getNombreUsuario(1)).toBe('Juan V');
    expect(component.getNombreUsuario(999)).toBe('Desconocido');
  });

  it('getColorAccion / getIconoAccion: devuelve valores conocidos y defaults', () => {
    expect(component.getColorAccion('CREAR')).toContain('bg-blue');
    expect(component.getColorAccion('OTRA')).toContain('bg-gray');

    expect(component.getIconoAccion('ELIMINAR')).toBe('fa-trash');
    expect(component.getIconoAccion('OTRA')).toBe('fa-info-circle');
  });
});
