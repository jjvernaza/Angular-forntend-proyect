// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  const apiUrl = 'http://localhost:3000/api/users';

  const mockUser = {
    id: 1,
    nombre: 'Juan',
    apellidos: 'Pérez',
    funcion: 'admin',
    permisos: ['dashboard.ver', 'clientes.leer', 'usuarios.crear']
  };

  const mockAuthResponse = {
    message: 'Login exitoso',
    token: 'mock-token-123',
    user: mockUser
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== LOGIN =====

  it('login → debería autenticar usuario y guardar token', (done) => {
    service.login('juan', 'password123').subscribe(response => {
      expect(response).toEqual(mockAuthResponse);
      expect(localStorage.getItem('authToken')).toBe('mock-token-123');
      expect(localStorage.getItem('currentUser')).toBeTruthy();
      done();
    });

    const req = httpMock.expectOne(`${apiUrl}/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ user: 'juan', password: 'password123' });
    req.flush(mockAuthResponse);
  });

  // ===== TOKEN =====

  it('getToken → debería obtener token de localStorage', () => {
    localStorage.setItem('authToken', 'test-token');
    expect(service.getToken()).toBe('test-token');
  });

  it('isAuthenticated → debería retornar true si hay token', () => {
    localStorage.setItem('authToken', 'test-token');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('isAuthenticated → debería retornar false si no hay token', () => {
    expect(service.isAuthenticated()).toBeFalse();
  });

  // ===== USUARIO ACTUAL =====

  it('getCurrentUser → debería obtener usuario de memoria', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.getCurrentUser()).toEqual(mockUser);
  });

  it('getCurrentUser → debería obtener usuario de localStorage', () => {
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    expect(service.getCurrentUser()).toEqual(mockUser);
  });

  it('getCurrentUser → debería retornar null si no hay usuario', () => {
    expect(service.getCurrentUser()).toBeNull();
  });

  // ===== PERMISOS =====

  it('hasPermission → debería retornar true si usuario tiene el permiso', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.hasPermission('dashboard.ver')).toBeTrue();
  });

  it('hasPermission → debería retornar false si usuario no tiene el permiso', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.hasPermission('clientes.eliminar')).toBeFalse();
  });

  it('hasPermission → debería retornar false si no hay usuario', () => {
    expect(service.hasPermission('dashboard.ver')).toBeFalse();
  });

  it('hasAnyPermission → debería retornar true si tiene algún permiso', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.hasAnyPermission(['clientes.leer', 'clientes.eliminar'])).toBeTrue();
  });

  it('hasAnyPermission → debería retornar false si no tiene ningún permiso', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.hasAnyPermission(['clientes.eliminar', 'pagos.eliminar'])).toBeFalse();
  });

  it('hasAllPermissions → debería retornar true si tiene todos los permisos', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.hasAllPermissions(['dashboard.ver', 'clientes.leer'])).toBeTrue();
  });

  it('hasAllPermissions → debería retornar false si falta algún permiso', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.hasAllPermissions(['dashboard.ver', 'clientes.eliminar'])).toBeFalse();
  });

  it('getUserPermissions → debería retornar array de permisos', () => {
    service['currentUserSubject'].next(mockUser);
    const permisos = service.getUserPermissions();
    expect(permisos.length).toBe(3);
    expect(permisos).toContain('dashboard.ver');
  });

  it('getUserPermissions → debería retornar array vacío si no hay usuario', () => {
    expect(service.getUserPermissions()).toEqual([]);
  });

  // ===== RUTAS =====

  it('getFirstAvailableRoute → debería retornar /dashboard si tiene permiso', () => {
    service['currentUserSubject'].next(mockUser);
    expect(service.getFirstAvailableRoute()).toBe('/dashboard');
  });

  it('getFirstAvailableRoute → debería retornar /login si no tiene permisos', () => {
    service['currentUserSubject'].next({ 
      id: 1, 
      nombre: 'Test', 
      permisos: [] 
    });
    expect(service.getFirstAvailableRoute()).toBe('/login');
  });

  it('getFirstAvailableRoute → debería retornar primera ruta disponible', () => {
    service['currentUserSubject'].next({ 
      id: 1, 
      nombre: 'Test', 
      permisos: ['clientes.crear'] 
    });
    expect(service.getFirstAvailableRoute()).toBe('/agregar-cliente');
  });

  // ===== LOGOUT =====

  it('logout → debería limpiar localStorage y navegar a login', () => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    service['currentUserSubject'].next(mockUser);

    service.logout();

    const req = httpMock.expectOne(`${apiUrl}/logout`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Logout exitoso' });

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
    expect(service.getCurrentUser()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logout → debería continuar si falla la llamada al servidor', () => {
    localStorage.setItem('authToken', 'test-token');

    service.logout();

    const req = httpMock.expectOne(`${apiUrl}/logout`);
    req.error(new ProgressEvent('error'));

    expect(localStorage.getItem('authToken')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // ===== CARGAR USUARIO =====

  it('loadUserFromStorage → debería cargar usuario al iniciar si hay token', () => {
    localStorage.setItem('authToken', 'test-token');
    localStorage.setItem('currentUser', JSON.stringify(mockUser));

    // Crear nueva instancia del servicio para ejecutar el constructor
    const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any, routerSpy);

    newService.currentUser.subscribe(user => {
      if (user) {
        expect(user.nombre).toBe('Juan');
      }
    });
  });
});