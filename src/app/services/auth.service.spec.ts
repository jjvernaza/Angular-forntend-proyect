// src/app/services/auth.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService - NetRoots VozIP', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  // Mock data específico para VozIP Company
  const mockUser = {
    id: 1,
    nombre: 'Juan Carlos',
    apellidos: 'Vernaza Mayor',
    funcion: 'Administrador',
    permisos: ['dashboard', 'clientes', 'pagos', 'morosos', 'reportes']
  };

  const mockAuthResponse = {
    message: 'Login exitoso',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake-token-vozip',
    user: mockUser
  };

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Limpiar localStorage antes de cada prueba
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Login Operations', () => {
    it('should login VozIP user successfully', () => {
      const username = 'admin_vozip';
      const password = 'vozip2024';

      service.login(username, password).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(response.user.nombre).toBe('Juan Carlos');
        expect(response.user.funcion).toBe('Administrador');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ user: username, password: password });
      req.flush(mockAuthResponse);
    });

    it('should save token and update current user on login', () => {
      spyOn(localStorage, 'setItem');
      
      service.login('admin', 'password').subscribe();

      const req = httpMock.expectOne('http://localhost:3000/api/users/login');
      req.flush(mockAuthResponse);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockAuthResponse.token);
      
      service.currentUser.subscribe(user => {
        expect(user).toEqual(mockUser);
      });
    });

    it('should handle login error', () => {
      service.login('wrong_user', 'wrong_pass').subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/login');
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Token Management', () => {
    it('should save token to localStorage', () => {
      const token = 'fake-jwt-token-vozip';
      spyOn(localStorage, 'setItem');

      service.saveToken(token);

      expect(localStorage.setItem).toHaveBeenCalledWith('token', token);
    });

    it('should get token from localStorage', () => {
      const token = 'stored-token-vozip';
      spyOn(localStorage, 'getItem').and.returnValue(token);

      const retrievedToken = service.getToken();

      expect(localStorage.getItem).toHaveBeenCalledWith('token');
      expect(retrievedToken).toBe(token);
    });

    it('should return null when no token stored', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const token = service.getToken();

      expect(token).toBeNull();
    });

    it('should verify user is authenticated with valid token', () => {
      spyOn(localStorage, 'getItem').and.returnValue('valid-token');

      const isAuth = service.isAuthenticated();

      expect(isAuth).toBeTruthy();
    });

    it('should verify user is not authenticated without token', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const isAuth = service.isAuthenticated();

      expect(isAuth).toBeFalsy();
    });
  });

  describe('Token Verification and User Loading', () => {
    it('should load user from valid token on service init', () => {
      spyOn(localStorage, 'getItem').and.returnValue('valid-token');
      
      // Crear nueva instancia para simular inicialización del constructor
      const testService = new AuthService(
        TestBed.inject(HttpClient),
        router
      );
      
      const req = httpMock.expectOne('http://localhost:3000/api/users/verify-token');
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'Token válido', user: mockUser });

      testService.currentUser.subscribe(user => {
        expect(user).toEqual(mockUser);
      });
    });

    it('should logout when token verification fails', () => {
      spyOn(localStorage, 'getItem').and.returnValue('invalid-token');
      spyOn(service, 'logout').and.callThrough();

      // Crear nueva instancia para simular constructor
      const testService = new AuthService(
        TestBed.inject(HttpClient),
        router
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/verify-token');
      req.flush('Token inválido', { status: 401, statusText: 'Unauthorized' });

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle no user in verification response', () => {
      spyOn(localStorage, 'getItem').and.returnValue('token');
      spyOn(service, 'logout').and.callThrough();

      const testService = new AuthService(
        TestBed.inject(HttpClient),
        router
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/verify-token');
      req.flush({ message: 'Token válido', user: null });

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('User Information', () => {
    it('should get current user', () => {
      service['currentUserSubject'].next(mockUser);

      const currentUser = service.getCurrentUser();

      expect(currentUser).toEqual(mockUser);
    });

    it('should return null when no current user', () => {
      service['currentUserSubject'].next(null);

      const currentUser = service.getCurrentUser();

      expect(currentUser).toBeNull();
    });
  });

  describe('Permission Management', () => {
    beforeEach(() => {
      service['currentUserSubject'].next(mockUser);
    });

    it('should check if user has specific permission', () => {
      const hasClientes = service.hasPermission('clientes');
      const hasPagos = service.hasPermission('pagos');
      const hasInvalid = service.hasPermission('invalid_permission');

      expect(hasClientes).toBeTruthy();
      expect(hasPagos).toBeTruthy();
      expect(hasInvalid).toBeFalsy();
    });

    it('should return false when user has no permissions', () => {
      const userWithoutPerms = { ...mockUser, permisos: undefined };
      service['currentUserSubject'].next(userWithoutPerms);

      const hasPermission = service.hasPermission('clientes');

      expect(hasPermission).toBeFalsy();
    });

    it('should return false when no current user', () => {
      service['currentUserSubject'].next(null);

      const hasPermission = service.hasPermission('clientes');

      expect(hasPermission).toBeFalsy();
    });

    it('should check if user has any of the specified permissions', () => {
      const hasAnyValid = service.hasAnyPermission(['clientes', 'invalid']);
      const hasAnyInvalid = service.hasAnyPermission(['invalid1', 'invalid2']);
      const hasAllValid = service.hasAnyPermission(['dashboard', 'pagos']);

      expect(hasAnyValid).toBeTruthy();
      expect(hasAnyInvalid).toBeFalsy();
      expect(hasAllValid).toBeTruthy();
    });

    it('should return false for hasAnyPermission when user has no permissions', () => {
      const userWithoutPerms = { ...mockUser, permisos: [] };
      service['currentUserSubject'].next(userWithoutPerms);

      const hasAny = service.hasAnyPermission(['clientes', 'pagos']);

      expect(hasAny).toBeFalsy();
    });
  });

  describe('Logout Operations', () => {
    it('should logout and clear user data', () => {
      spyOn(localStorage, 'removeItem');
      service['currentUserSubject'].next(mockUser);

      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
      
      service.currentUser.subscribe(user => {
        expect(user).toBeNull();
      });
    });

    it('should redirect to login page on logout', () => {
      service.logout();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('VozIP Specific Scenarios', () => {
    it('should handle VozIP admin user permissions', () => {
      const adminUser = {
        ...mockUser,
        funcion: 'Administrador',
        permisos: ['dashboard', 'clientes', 'pagos', 'morosos', 'servicios', 'usuarios', 'reportes']
      };
      service['currentUserSubject'].next(adminUser);

      expect(service.hasPermission('usuarios')).toBeTruthy();
      expect(service.hasPermission('reportes')).toBeTruthy();
      expect(service.hasAnyPermission(['morosos', 'servicios'])).toBeTruthy();
    });

    it('should handle VozIP employee user with limited permissions', () => {
      const employeeUser = {
        ...mockUser,
        funcion: 'Empleado',
        permisos: ['dashboard', 'clientes', 'pagos']
      };
      service['currentUserSubject'].next(employeeUser);

      expect(service.hasPermission('clientes')).toBeTruthy();
      expect(service.hasPermission('pagos')).toBeTruthy();
      expect(service.hasPermission('usuarios')).toBeFalsy();
      expect(service.hasPermission('reportes')).toBeFalsy();
    });

    it('should handle rural technician permissions', () => {
      const techUser = {
        ...mockUser,
        nombre: 'Carlos',
        apellidos: 'Técnico Rural',
        funcion: 'Técnico',
        permisos: ['clientes', 'servicios']
      };
      service['currentUserSubject'].next(techUser);

      expect(service.hasPermission('servicios')).toBeTruthy();
      expect(service.hasPermission('clientes')).toBeTruthy();
      expect(service.hasPermission('pagos')).toBeFalsy();
      expect(service.hasAnyPermission(['servicios', 'clientes'])).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle network error during login', () => {
      service.login('user', 'pass').subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(0);
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/login');
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle server error during token verification', () => {
      spyOn(localStorage, 'getItem').and.returnValue('token');

      const testService = new AuthService(
        TestBed.inject(HttpClient),
        router
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/verify-token');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle missing token during verification', () => {
      spyOn(localStorage, 'getItem').and.returnValue('');

      const testService = new AuthService(
        TestBed.inject(HttpClient),
        router
      );

      // No debería hacer petición HTTP si no hay token
      httpMock.expectNone('http://localhost:3000/api/users/verify-token');
      
      // Agregar expectativa para eliminar warning
      expect(service).toBeTruthy();
    });
  });

  describe('Observable Behavior', () => {
    it('should emit user changes to subscribers', (done) => {
      let emissionCount = 0;
      const expectedUsers = [null, mockUser, null];

      service.currentUser.subscribe(user => {
        expect(user).toEqual(expectedUsers[emissionCount]);
        emissionCount++;
        
        if (emissionCount === 3) {
          done();
        }
      });

      // Simular cambios de usuario
      service['currentUserSubject'].next(mockUser);
      service['currentUserSubject'].next(null);
    });

    it('should handle multiple subscribers correctly', () => {
      let subscriber1Called = false;
      let subscriber2Called = false;

      service.currentUser.subscribe(user => {
        subscriber1Called = true;
      });

      service.currentUser.subscribe(user => {
        subscriber2Called = true;
      });

      service['currentUserSubject'].next(mockUser);

      expect(subscriber1Called).toBeTruthy();
      expect(subscriber2Called).toBeTruthy();
    });
  });

  describe('Constructor Behavior', () => {
    it('should not call loadUserFromToken when no token present', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      
      const testService = new AuthService(
        TestBed.inject(HttpClient),
        router
      );

      // No debería hacer petición HTTP
      httpMock.expectNone('http://localhost:3000/api/users/verify-token');
      
      // Agregar expectativa para eliminar warning
      expect(testService).toBeTruthy();
    });

    it('should call loadUserFromToken when token is present', () => {
      spyOn(localStorage, 'getItem').and.returnValue('existing-token');
      
      const testService = new AuthService(
        TestBed.inject(HttpClient),
        router
      );

      // Debería hacer petición para verificar token
      const req = httpMock.expectOne('http://localhost:3000/api/users/verify-token');
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'Token válido', user: mockUser });
    });
  });
});