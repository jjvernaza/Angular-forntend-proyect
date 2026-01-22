import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { TiposServicioComponent } from './tipos-servicio.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';

describe('TiposServicioComponent', () => {
  let component: TiposServicioComponent;
  let fixture: ComponentFixture<TiposServicioComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockTiposServicio = [
    { ID: 1, Tipo: 'Consultoría', Descripcion: 'Servicios de consultoría' },
    { ID: 2, Tipo: 'Desarrollo', Descripcion: 'Desarrollo de software' },
    { ID: 3, Tipo: 'Soporte', Descripcion: 'Soporte técnico' }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getTiposServicio',
      'createTipoServicio',
      'updateTipoServicio',
      'deleteTipoServicio'
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of(),
      url: '/tipos-servicio'
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
      imports: [TiposServicioComponent],
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
    apiService.getTiposServicio.and.returnValue(of([]));

    fixture = TestBed.createComponent(TiposServicioComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('debe verificar permisos y cargar tipos de servicio si tiene permiso de lectura', () => {
      authService.hasPermission.and.callFake((permiso: string) => {
        return permiso === 'tipos_servicio.leer';
      });
      apiService.getTiposServicio.and.returnValue(of(mockTiposServicio));

      component.ngOnInit();

      expect(component.tienePermisoLeer).toBe(true);
      expect(component.tienePermisoCrear).toBe(false);
      expect(component.tienePermisoActualizar).toBe(false);
      expect(component.tienePermisoEliminar).toBe(false);
      expect(apiService.getTiposServicio).toHaveBeenCalled();
      expect(component.tiposServicio).toEqual(mockTiposServicio);
    });

    it('no debe cargar tipos de servicio si no tiene permiso de lectura', () => {
      authService.hasPermission.and.returnValue(false);

      component.ngOnInit();

      expect(component.tienePermisoLeer).toBe(false);
      expect(apiService.getTiposServicio).not.toHaveBeenCalled();
    });

    it('debe establecer todos los permisos correctamente', () => {
      authService.hasPermission.and.returnValue(true);
      apiService.getTiposServicio.and.returnValue(of(mockTiposServicio));

      component.ngOnInit();

      expect(component.tienePermisoLeer).toBe(true);
      expect(component.tienePermisoCrear).toBe(true);
      expect(component.tienePermisoActualizar).toBe(true);
      expect(component.tienePermisoEliminar).toBe(true);
    });
  });

  describe('cargarTiposServicio', () => {
    it('debe cargar tipos de servicio exitosamente', () => {
      component.tienePermisoLeer = true;
      apiService.getTiposServicio.and.returnValue(of(mockTiposServicio));

      component.cargarTiposServicio();

      expect(apiService.getTiposServicio).toHaveBeenCalled();
      expect(component.tiposServicio).toEqual(mockTiposServicio);
    });

    it('no debe cargar si no tiene permiso de lectura', () => {
      component.tienePermisoLeer = false;

      component.cargarTiposServicio();

      expect(apiService.getTiposServicio).not.toHaveBeenCalled();
    });

    it('debe manejar error al cargar tipos de servicio', () => {
      component.tienePermisoLeer = true;
      apiService.getTiposServicio.and.returnValue(throwError(() => new Error('Error de red')));
      spyOn(window, 'alert');

      component.cargarTiposServicio();

      expect(window.alert).toHaveBeenCalledWith('Error al cargar tipos de servicio');
    });
  });

  describe('abrirModalAgregar', () => {
    it('debe abrir modal si tiene permiso de crear', () => {
      component.tienePermisoCrear = true;

      component.abrirModalAgregar();

      expect(component.modalAbierto).toBe(true);
      expect(component.esEdicion).toBe(false);
      expect(component.tipoServicioForm.ID).toBeNull();
      expect(component.tipoServicioForm.Tipo).toBe('');
      expect(component.tipoServicioForm.Descripcion).toBe('');
    });

    it('debe mostrar alerta si no tiene permiso de crear', () => {
      component.tienePermisoCrear = false;
      spyOn(window, 'alert');

      component.abrirModalAgregar();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear tipos de servicio.');
      expect(component.modalAbierto).toBe(false);
    });
  });

  describe('abrirModalEditar', () => {
    it('debe abrir modal con datos del tipo si tiene permiso de actualizar', () => {
      component.tienePermisoActualizar = true;
      const tipoEditar: any = { ID: 1, Tipo: 'Consultoría', Descripcion: 'Servicios de consultoría' };

      component.abrirModalEditar(tipoEditar);

      expect(component.modalAbierto).toBe(true);
      expect(component.esEdicion).toBe(true);
      expect(component.tipoServicioForm.ID).toBe(1 as any);
      expect(component.tipoServicioForm.Tipo).toBe('Consultoría');
      expect(component.tipoServicioForm.Descripcion).toBe('Servicios de consultoría');
    });

    it('debe manejar tipo sin descripción', () => {
      component.tienePermisoActualizar = true;
      const tipoSinDescripcion: any = { ID: 1, Tipo: 'Consultoría' };

      component.abrirModalEditar(tipoSinDescripcion);

      expect(component.modalAbierto).toBe(true);
      expect(component.esEdicion).toBe(true);
      expect(component.tipoServicioForm.ID).toBe(1 as any);
      expect(component.tipoServicioForm.Tipo).toBe('Consultoría');
      expect(component.tipoServicioForm.Descripcion).toBe('');
    });

    it('debe mostrar alerta si no tiene permiso de actualizar', () => {
      component.tienePermisoActualizar = false;
      const tipoEditar: any = { ID: 1, Tipo: 'Consultoría', Descripcion: 'Servicios de consultoría' };
      spyOn(window, 'alert');

      component.abrirModalEditar(tipoEditar);

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para editar tipos de servicio.');
      expect(component.modalAbierto).toBe(false);
    });
  });

  describe('guardarTipoServicio', () => {
    it('debe crear tipo de servicio exitosamente', () => {
      component.esEdicion = false;
      component.tienePermisoCrear = true;
      component.tipoServicioForm = {
        ID: null,
        Tipo: 'Consultoría',
        Descripcion: 'Servicios de consultoría'
      };
      apiService.createTipoServicio.and.returnValue(of({}));
      spyOn(component, 'cargarTiposServicio');
      spyOn(window, 'alert');

      component.guardarTipoServicio();

      expect(apiService.createTipoServicio).toHaveBeenCalledWith(component.tipoServicioForm);
      expect(component.modalAbierto).toBe(false);
      expect(component.cargarTiposServicio).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Tipo de servicio creado correctamente');
    });

    it('debe actualizar tipo de servicio exitosamente', () => {
      component.esEdicion = true;
      component.tienePermisoActualizar = true;
      component.tipoServicioForm = {
        ID: 1 as any,
        Tipo: 'Consultoría',
        Descripcion: 'Servicios de consultoría'
      };
      apiService.updateTipoServicio.and.returnValue(of({}));
      spyOn(component, 'cargarTiposServicio');
      spyOn(window, 'alert');

      component.guardarTipoServicio();

      expect(apiService.updateTipoServicio).toHaveBeenCalledWith(1, component.tipoServicioForm);
      expect(component.modalAbierto).toBe(false);
      expect(component.cargarTiposServicio).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Tipo de servicio actualizado correctamente');
    });

    it('debe mostrar alerta si el tipo está vacío', () => {
      component.tienePermisoCrear = true;
      component.tipoServicioForm = {
        ID: null,
        Tipo: '  ',
        Descripcion: ''
      };
      spyOn(window, 'alert');

      component.guardarTipoServicio();

      expect(window.alert).toHaveBeenCalledWith('El tipo de servicio es obligatorio');
      expect(apiService.createTipoServicio).not.toHaveBeenCalled();
      expect(apiService.updateTipoServicio).not.toHaveBeenCalled();
    });

    it('debe mostrar alerta si no tiene permiso de crear', () => {
      component.esEdicion = false;
      component.tienePermisoCrear = false;
      component.tipoServicioForm = {
        ID: null,
        Tipo: 'Consultoría',
        Descripcion: ''
      };
      spyOn(window, 'alert');

      component.guardarTipoServicio();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear tipos de servicio.');
      expect(apiService.createTipoServicio).not.toHaveBeenCalled();
    });

    it('debe mostrar alerta si no tiene permiso de actualizar', () => {
      component.esEdicion = true;
      component.tienePermisoActualizar = false;
      component.tipoServicioForm = {
        ID: 1 as any,
        Tipo: 'Consultoría',
        Descripcion: ''
      };
      spyOn(window, 'alert');

      component.guardarTipoServicio();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para actualizar tipos de servicio.');
      expect(apiService.updateTipoServicio).not.toHaveBeenCalled();
    });

    it('debe manejar error al crear', () => {
      component.esEdicion = false;
      component.tienePermisoCrear = true;
      component.tipoServicioForm = {
        ID: null,
        Tipo: 'Consultoría',
        Descripcion: ''
      };
      apiService.createTipoServicio.and.returnValue(throwError(() => new Error('Error')));
      spyOn(window, 'alert');

      component.guardarTipoServicio();

      expect(window.alert).toHaveBeenCalledWith('Error al crear el tipo de servicio');
    });

    it('debe manejar error al actualizar', () => {
      component.esEdicion = true;
      component.tienePermisoActualizar = true;
      component.tipoServicioForm = {
        ID: 1 as any,
        Tipo: 'Consultoría',
        Descripcion: ''
      };
      apiService.updateTipoServicio.and.returnValue(throwError(() => new Error('Error')));
      spyOn(window, 'alert');

      component.guardarTipoServicio();

      expect(window.alert).toHaveBeenCalledWith('Error al actualizar el tipo de servicio');
    });
  });

  describe('abrirModalEliminar', () => {
    it('debe abrir modal de eliminar si tiene permiso', () => {
      component.tienePermisoEliminar = true;
      const tipoEliminar: any = { ID: 1, Tipo: 'Consultoría', Descripcion: 'Servicios' };

      component.abrirModalEliminar(tipoEliminar);

      expect(component.modalEliminar).toBe(true);
      expect(component.tipoEliminarId).toBe(1);
      expect(component.tipoEliminarNombre).toBe('Consultoría');
    });

    it('debe mostrar alerta si no tiene permiso de eliminar', () => {
      component.tienePermisoEliminar = false;
      const tipoEliminar: any = { ID: 1, Tipo: 'Consultoría', Descripcion: 'Servicios' };
      spyOn(window, 'alert');

      component.abrirModalEliminar(tipoEliminar);

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para eliminar tipos de servicio.');
      expect(component.modalEliminar).toBe(false);
    });
  });

  describe('eliminarTipoServicio', () => {
    it('debe eliminar tipo de servicio exitosamente', () => {
      component.tienePermisoEliminar = true;
      component.tipoEliminarId = 1;
      apiService.deleteTipoServicio.and.returnValue(of({}));
      spyOn(component, 'cargarTiposServicio');
      spyOn(window, 'alert');

      component.eliminarTipoServicio();

      expect(apiService.deleteTipoServicio).toHaveBeenCalledWith(1);
      expect(component.modalEliminar).toBe(false);
      expect(component.cargarTiposServicio).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Tipo de servicio eliminado correctamente');
    });

    it('no debe eliminar si no tiene permiso', () => {
      component.tienePermisoEliminar = false;
      component.tipoEliminarId = 1;
      spyOn(window, 'alert');

      component.eliminarTipoServicio();

      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para eliminar tipos de servicio.');
      expect(apiService.deleteTipoServicio).not.toHaveBeenCalled();
    });

    it('no debe eliminar si tipoEliminarId es null', () => {
      component.tienePermisoEliminar = true;
      component.tipoEliminarId = null;

      component.eliminarTipoServicio();

      expect(apiService.deleteTipoServicio).not.toHaveBeenCalled();
    });

    it('debe manejar error al eliminar', () => {
      component.tienePermisoEliminar = true;
      component.tipoEliminarId = 1;
      apiService.deleteTipoServicio.and.returnValue(throwError(() => new Error('Error')));
      spyOn(window, 'alert');

      component.eliminarTipoServicio();

      expect(window.alert).toHaveBeenCalledWith('Error al eliminar el tipo de servicio. Puede estar en uso por clientes.');
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
});