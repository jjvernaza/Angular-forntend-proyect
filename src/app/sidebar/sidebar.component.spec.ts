import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../services/auth.service';
import { of } from 'rxjs';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const mockUser = {
    id: 1,
    nombre: 'Juan',
    apellidos: 'Pérez',
    funcion: 'Administrador'
  };

  const mockPermisos = ['usuarios.leer', 'clientes.crear', 'dashboard.ver'];

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getCurrentUser',
      'getUserPermissions',
      'hasPermission',
      'hasAnyPermission',
      'logout'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: of(),
      url: '/test'
    });

    // Mock más completo de ActivatedRoute
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
      imports: [SidebarComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe establecer el año actual', () => {
    expect(component.currentYear).toBe(new Date().getFullYear());
  });

  describe('ngOnInit', () => {
    it('debe redirigir a login si no está autenticado', () => {
      authService.isAuthenticated.and.returnValue(false);

      component.ngOnInit();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('debe cargar datos del usuario si está autenticado', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(mockUser);
      authService.getUserPermissions.and.returnValue(mockPermisos);

      component.ngOnInit();

      expect(component.userName).toBe('Juan Pérez');
      expect(component.userPermissions).toEqual(mockPermisos);
    });

    it('debe manejar usuario sin apellidos', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue({ 
        id: mockUser.id,
        nombre: mockUser.nombre,
        funcion: mockUser.funcion,
        apellidos: ''
      });
      authService.getUserPermissions.and.returnValue(mockPermisos);

      component.ngOnInit();

      expect(component.userName).toBe('Juan');
    });

    it('debe manejar usuario con apellidos undefined', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue({ 
        id: mockUser.id,
        nombre: mockUser.nombre,
        funcion: mockUser.funcion
      } as any);
      authService.getUserPermissions.and.returnValue(mockPermisos);

      component.ngOnInit();

      expect(component.userName).toBe('Juan');
    });

    it('no debe cargar datos si getCurrentUser retorna null', () => {
      authService.isAuthenticated.and.returnValue(true);
      authService.getCurrentUser.and.returnValue(null);

      component.ngOnInit();

      expect(component.userName).toBe('');
      expect(component.userPermissions).toEqual([]);
    });
  });

  describe('cerrarSesion', () => {
    it('debe cerrar sesión si el usuario confirma', () => {
      spyOn(window, 'confirm').and.returnValue(true);

      component.cerrarSesion();

      expect(authService.logout).toHaveBeenCalled();
    });

    it('no debe cerrar sesión si el usuario cancela', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.cerrarSesion();

      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  describe('tienePermiso', () => {
    it('debe retornar true si tiene el permiso', () => {
      authService.hasPermission.and.returnValue(true);

      const resultado = component.tienePermiso('usuarios.leer');

      expect(resultado).toBe(true);
      expect(authService.hasPermission).toHaveBeenCalledWith('usuarios.leer');
    });

    it('debe retornar false si no tiene el permiso', () => {
      authService.hasPermission.and.returnValue(false);

      const resultado = component.tienePermiso('usuarios.eliminar');

      expect(resultado).toBe(false);
    });
  });

  describe('tieneAlgunoDeEstosPermisos', () => {
    it('debe retornar true si tiene al menos uno de los permisos', () => {
      authService.hasAnyPermission.and.returnValue(true);

      const resultado = component.tieneAlgunoDeEstosPermisos(['usuarios.leer', 'usuarios.crear']);

      expect(resultado).toBe(true);
      expect(authService.hasAnyPermission).toHaveBeenCalledWith(['usuarios.leer', 'usuarios.crear']);
    });

    it('debe retornar false si no tiene ninguno de los permisos', () => {
      authService.hasAnyPermission.and.returnValue(false);

      const resultado = component.tieneAlgunoDeEstosPermisos(['admin.all']);

      expect(resultado).toBe(false);
    });
  });

  describe('verificarPermiso', () => {
    let event: Event;

    beforeEach(() => {
      event = new Event('click');
      spyOn(event, 'preventDefault');
      spyOn(window, 'alert');
    });

    it('debe prevenir evento y mostrar alerta si no tiene permisos', () => {
      authService.hasAnyPermission.and.returnValue(false);

      component.verificarPermiso(event, ['usuarios.crear']);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('No tienes permisos para acceder a esta sección.');
    });

    it('no debe prevenir evento si tiene permisos', () => {
      authService.hasAnyPermission.and.returnValue(true);

      component.verificarPermiso(event, ['usuarios.leer']);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(window.alert).not.toHaveBeenCalled();
    });
  });
});