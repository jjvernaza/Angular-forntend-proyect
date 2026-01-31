import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { EstadosComponent } from './estados.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';

describe('EstadosComponent', () => {
  let component: EstadosComponent;
  let fixture: ComponentFixture<EstadosComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockEstados = [
    { ID: 1, Estado: 'Activo', Color: '#22c55e' },
    { ID: 2, Estado: 'Inactivo', Color: '#ef4444' },
    { ID: 3, Estado: 'Suspendido', Color: '#eab308' }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getEstados',
      'createEstado',
      'updateEstado',
      'deleteEstado'
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of(),
      url: '/estados'
    });

    const activatedRouteMock = {
      snapshot: {
        params: {},
        queryParams: {},
        data: {},
        url: []
      },
      params: of({}),
      queryParams: of({}),
      data: of({})
    };

    await TestBed.configureTestingModule({
      imports: [EstadosComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    authService.hasPermission.and.returnValue(false);
    apiService.getEstados.and.returnValue(of([]));

    fixture = TestBed.createComponent(EstadosComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe inicializar colores predefinidos', () => {
    expect(component.coloresEstado.length).toBe(6);
    expect(component.coloresEstado[0].valor).toBe('#22c55e');
  });

  describe('ngOnInit', () => {
    it('debe verificar permisos y cargar estados si tiene permiso de lectura', () => {
      authService.hasPermission.and.callFake((permiso: string) => {
        return permiso === 'estados.leer';
      });
      apiService.getEstados.and.returnValue(of(mockEstados));

      component.ngOnInit();

      expect(component.tienePermisoLeer).toBe(true);
      expect(component.tienePermisoCrear).toBe(false);
      expect(component.tienePermisoActualizar).toBe(false);
      expect(component.tienePermisoEliminar).toBe(false);
      expect(apiService.getEstados).toHaveBeenCalled();
      expect(component.estados).toEqual(mockEstados);
    });

    it('no debe cargar estados si no tiene permiso de lectura', () => {
      authService.hasPermission.and.returnValue(false);

      component.ngOnInit();

      expect(component.tienePermisoLeer).toBe(false);
      expect(apiService.getEstados).not.toHaveBeenCalled();
    });

    it('debe establecer todos los permisos correctamente', () => {
      authService.hasPermission.and.returnValue(true);
      apiService.getEstados.and.returnValue(of(mockEstados));

      component.ngOnInit();

      expect(component.tienePermisoLeer).toBe(true);
      expect(component.tienePermisoCrear).toBe(true);
      expect(component.tienePermisoActualizar).toBe(true);
      expect(component.tienePermisoEliminar).toBe(true);
    });
  });

  describe('cargarEstados', () => {
    it('debe cargar estados exitosamente', () => {
      component.tienePermisoLeer = true;
      apiService.getEstados.and.returnValue(of(mockEstados));

      component.cargarEstados();

      expect(apiService.getEstados).toHaveBeenCalled();
      expect(component.estados).toEqual(mockEstados);
    });

    it('no debe cargar si no tiene permiso de lectura', () => {
      component.tienePermisoLeer = false;

      component.cargarEstados();

      expect(apiService.getEstados).not.toHaveBeenCalled();
    });

    it('debe manejar error al cargar estados', () => {
      component.tienePermisoLeer = true;
      const error = { error: { message: 'Error de red' } };
      apiService.getEstados.and.returnValue(throwError(() => error));
      spyOn(window, 'alert');

      component.cargarEstados();

      expect(window.alert).toHaveBeenCalledWith('Error al cargar estados: Error de red');
    });

    it('debe manejar error sin mensaje específico', () => {
      component.tienePermisoLeer = true;
      apiService.getEstados.and.returnValue(throwError(() => new Error('Error')));
      spyOn(window, 'alert');

      component.cargarEstados();

      expect(window.alert).toHaveBeenCalledWith('Error al cargar estados: Error desconocido');
    });
  });

  describe('abrirModalAgregar', () => {
    it('debe abrir modal si tiene permiso de crear', () => {
      component.tienePermisoCrear = true;

      component.abrirModalAgregar();

      expect(component.modalAbierto).toBe(true);
      expect(component.esEdicion).toBe(false);
      expect(component.estadoForm.ID).toBeNull();
      expect(component.estadoForm.Estado).toBe('');
      expect(component.estadoForm.Color).toBe('#22c55e');
    });

    it('debe mostrar alerta si no tiene permiso de crear', () => {
      component.tienePermisoCrear = false;
      spyOn(window, 'alert');

      component.abrirModalAgregar();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear estados.');
      expect(component.modalAbierto).toBe(false);
    });
  });

  describe('abrirModalEditar', () => {
    it('debe abrir modal con datos del estado si tiene permiso de actualizar', () => {
      component.tienePermisoActualizar = true;
      const estadoEditar: any = { ID: 1, Estado: 'Activo', Color: '#22c55e' };

      component.abrirModalEditar(estadoEditar);

      expect(component.modalAbierto).toBe(true);
      expect(component.esEdicion).toBe(true);
      expect(component.estadoForm.ID).toBe(1 as any);
      expect(component.estadoForm.Estado).toBe('Activo');
      expect(component.estadoForm.Color).toBe('#22c55e');
    });

    it('debe manejar estado sin color', () => {
      component.tienePermisoActualizar = true;
      const estadoSinColor: any = { ID: 1, Estado: 'Activo' };

      component.abrirModalEditar(estadoSinColor);

      expect(component.modalAbierto).toBe(true);
      expect(component.esEdicion).toBe(true);
      expect(component.estadoForm.ID).toBe(1 as any);
      expect(component.estadoForm.Estado).toBe('Activo');
      expect(component.estadoForm.Color).toBe('#22c55e');
    });

    it('debe mostrar alerta si no tiene permiso de actualizar', () => {
      component.tienePermisoActualizar = false;
      const estadoEditar: any = { ID: 1, Estado: 'Activo', Color: '#22c55e' };
      spyOn(window, 'alert');

      component.abrirModalEditar(estadoEditar);

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para editar estados.');
      expect(component.modalAbierto).toBe(false);
    });
  });

  describe('guardarEstado', () => {
    it('debe crear estado exitosamente', () => {
      component.esEdicion = false;
      component.tienePermisoCrear = true;
      component.estadoForm = {
        ID: null,
        Estado: 'Activo',
        Color: '#22c55e'
      };
      apiService.createEstado.and.returnValue(of({}));
      spyOn(component, 'cargarEstados');
      spyOn(window, 'alert');

      component.guardarEstado();

      expect(apiService.createEstado).toHaveBeenCalledWith(component.estadoForm);
      expect(component.modalAbierto).toBe(false);
      expect(component.cargarEstados).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Estado creado correctamente');
    });

    it('debe actualizar estado exitosamente', () => {
      component.esEdicion = true;
      component.tienePermisoActualizar = true;
      component.estadoForm = {
        ID: 1 as any,
        Estado: 'Activo',
        Color: '#22c55e'
      };
      apiService.updateEstado.and.returnValue(of({}));
      spyOn(component, 'cargarEstados');
      spyOn(window, 'alert');

      component.guardarEstado();

      expect(apiService.updateEstado).toHaveBeenCalledWith(1, component.estadoForm);
      expect(component.modalAbierto).toBe(false);
      expect(component.cargarEstados).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Estado actualizado correctamente');
    });

    it('debe mostrar alerta si el estado está vacío', () => {
      component.tienePermisoCrear = true;
      component.estadoForm = {
        ID: null,
        Estado: '  ',
        Color: '#22c55e'
      };
      spyOn(window, 'alert');

      component.guardarEstado();

      expect(window.alert).toHaveBeenCalledWith('El nombre del estado es obligatorio');
      expect(apiService.createEstado).not.toHaveBeenCalled();
      expect(apiService.updateEstado).not.toHaveBeenCalled();
    });

    it('debe mostrar alerta si no tiene permiso de crear', () => {
      component.esEdicion = false;
      component.tienePermisoCrear = false;
      component.estadoForm = {
        ID: null,
        Estado: 'Activo',
        Color: '#22c55e'
      };
      spyOn(window, 'alert');

      component.guardarEstado();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear estados.');
      expect(apiService.createEstado).not.toHaveBeenCalled();
    });

    it('debe mostrar alerta si no tiene permiso de actualizar', () => {
      component.esEdicion = true;
      component.tienePermisoActualizar = false;
      component.estadoForm = {
        ID: 1 as any,
        Estado: 'Activo',
        Color: '#22c55e'
      };
      spyOn(window, 'alert');

      component.guardarEstado();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para actualizar estados.');
      expect(apiService.updateEstado).not.toHaveBeenCalled();
    });

    it('debe manejar error al crear', () => {
      component.esEdicion = false;
      component.tienePermisoCrear = true;
      component.estadoForm = {
        ID: null,
        Estado: 'Activo',
        Color: '#22c55e'
      };
      const error = { error: { message: 'Error al crear' } };
      apiService.createEstado.and.returnValue(throwError(() => error));
      spyOn(window, 'alert');

      component.guardarEstado();

      expect(window.alert).toHaveBeenCalledWith('Error al crear el estado: Error al crear');
    });

    it('debe manejar error al actualizar', () => {
      component.esEdicion = true;
      component.tienePermisoActualizar = true;
      component.estadoForm = {
        ID: 1 as any,
        Estado: 'Activo',
        Color: '#22c55e'
      };
      const error = { error: { message: 'Error al actualizar' } };
      apiService.updateEstado.and.returnValue(throwError(() => error));
      spyOn(window, 'alert');

      component.guardarEstado();

      expect(window.alert).toHaveBeenCalledWith('Error al actualizar el estado: Error al actualizar');
    });
  });

  describe('abrirModalEliminar', () => {
    it('debe abrir modal de eliminar si tiene permiso', () => {
      component.tienePermisoEliminar = true;
      const estadoEliminar: any = { ID: 1, Estado: 'Activo', Color: '#22c55e' };

      component.abrirModalEliminar(estadoEliminar);

      expect(component.modalEliminar).toBe(true);
      expect(component.estadoEliminarId).toBe(1);
      expect(component.estadoEliminarNombre).toBe('Activo');
    });

    it('debe mostrar alerta si no tiene permiso de eliminar', () => {
      component.tienePermisoEliminar = false;
      const estadoEliminar: any = { ID: 1, Estado: 'Activo', Color: '#22c55e' };
      spyOn(window, 'alert');

      component.abrirModalEliminar(estadoEliminar);

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para eliminar estados.');
      expect(component.modalEliminar).toBe(false);
    });
  });

  describe('eliminarEstado', () => {
    it('debe eliminar estado exitosamente', () => {
      component.tienePermisoEliminar = true;
      component.estadoEliminarId = 1;
      apiService.deleteEstado.and.returnValue(of({}));
      spyOn(component, 'cargarEstados');
      spyOn(window, 'alert');

      component.eliminarEstado();

      expect(apiService.deleteEstado).toHaveBeenCalledWith(1);
      expect(component.modalEliminar).toBe(false);
      expect(component.cargarEstados).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Estado eliminado correctamente');
    });

    it('no debe eliminar si no tiene permiso', () => {
      component.tienePermisoEliminar = false;
      component.estadoEliminarId = 1;
      spyOn(window, 'alert');

      component.eliminarEstado();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para eliminar estados.');
      expect(apiService.deleteEstado).not.toHaveBeenCalled();
    });

    it('no debe eliminar si estadoEliminarId es null', () => {
      component.tienePermisoEliminar = true;
      component.estadoEliminarId = null;

      component.eliminarEstado();

      expect(apiService.deleteEstado).not.toHaveBeenCalled();
    });

    it('debe manejar error al eliminar', () => {
      component.tienePermisoEliminar = true;
      component.estadoEliminarId = 1;
      const error = { error: { message: 'Estado en uso' } };
      apiService.deleteEstado.and.returnValue(throwError(() => error));
      spyOn(window, 'alert');

      component.eliminarEstado();

      expect(window.alert).toHaveBeenCalledWith('Error al eliminar el estado: Estado en uso');
    });
  });

  describe('cerrarModal', () => {
    it('debe cerrar ambos modales', () => {
      component.modalAbierto = true;
      component.modalEliminar = true;

      component.cerrarModal();

      expect(component.modalAbierto).toBe(false);
      expect(component.modalEliminar).toBe(false);
    });
  });

  describe('getEstadoColor', () => {
    it('debe retornar color verde para estado Activo', () => {
      expect(component.getEstadoColor('Activo')).toBe('#22c55e');
      expect(component.getEstadoColor('activo')).toBe('#22c55e');
    });

    it('debe retornar color rojo para estado Inactivo', () => {
      expect(component.getEstadoColor('Inactivo')).toBe('#ef4444');
      expect(component.getEstadoColor('INACTIVO')).toBe('#ef4444');
    });

    it('debe retornar color amarillo para estado Suspendido', () => {
      expect(component.getEstadoColor('Suspendido')).toBe('#eab308');
    });

    it('debe retornar color azul para estado Prueba', () => {
      expect(component.getEstadoColor('Prueba')).toBe('#3b82f6');
    });

    it('debe retornar color morado para estado Mantenimiento', () => {
      expect(component.getEstadoColor('Mantenimiento')).toBe('#8b5cf6');
    });

    it('debe retornar color gris por defecto', () => {
      expect(component.getEstadoColor('Desconocido')).toBe('#6b7280');
      expect(component.getEstadoColor('')).toBe('#6b7280');
    });
  });

  describe('getTextColor', () => {
    it('debe retornar negro para fondos claros', () => {
      expect(component.getTextColor('#ffffff')).toBe('#000000');
      expect(component.getTextColor('#eab308')).toBe('#000000');
    });

    it('debe retornar blanco para fondos oscuros', () => {
      expect(component.getTextColor('#000000')).toBe('#ffffff');
      expect(component.getTextColor('#3b82f6')).toBe('#ffffff');
    });

    it('debe retornar negro para color vacío', () => {
      expect(component.getTextColor('')).toBe('#000000');
    });

    it('debe calcular correctamente para verde', () => {
      const color = component.getTextColor('#22c55e');
      expect(color).toBe('#000000');
    });

    it('debe calcular correctamente para rojo', () => {
      const color = component.getTextColor('#ef4444');
      expect(color).toBe('#ffffff');
    });
  });
});