// src/app/services/user.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/users';

  const mockUsers = [
    { id: 1, nombre: 'Juan', apellidos: 'Pérez', username: 'juan', funcion: 'admin' },
    { id: 2, nombre: 'María', apellidos: 'López', username: 'maria', funcion: 'user' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('authToken', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===== GET ALL =====

  it('getAllUsers → debería obtener todos los usuarios', () => {
    service.getAllUsers().subscribe(data => {
      expect(data).toEqual(mockUsers);
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(mockUsers);
  });

  // ===== GET BY ID =====

  it('getUserById → debería obtener usuario por ID', () => {
    const mockUser = mockUsers[0];

    service.getUserById(1).subscribe(data => {
      expect(data).toEqual(mockUser);
      expect(data.nombre).toBe('Juan');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  // ===== CREATE =====

  it('createUser → debería crear nuevo usuario', () => {
    const newUser = {
      nombre: 'Carlos',
      apellidos: 'Gómez',
      username: 'carlos',
      password: 'password123',
      funcion: 'user'
    };

    service.createUser(newUser).subscribe(data => {
      expect(data).toEqual({ id: 3, ...newUser });
    });

    const req = httpMock.expectOne(`${apiUrl}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush({ id: 3, ...newUser });
  });

  // ===== UPDATE =====

  it('updateUser → debería actualizar usuario', () => {
    const updatedUser = {
      nombre: 'Juan Actualizado',
      apellidos: 'Pérez',
      funcion: 'admin'
    };

    service.updateUser(1, updatedUser).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/update/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedUser);
    req.flush({ success: true });
  });

  // ===== CHANGE PASSWORD =====

  it('changePassword → debería cambiar contraseña de usuario', () => {
    service.changePassword(1, 'oldPassword', 'newPassword123').subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/change-password/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({
      currentPassword: 'oldPassword',
      newPassword: 'newPassword123'
    });
    req.flush({ success: true, message: 'Contraseña actualizada' });
  });

  // ===== DELETE =====

  it('deleteUser → debería eliminar usuario', () => {
    service.deleteUser(1).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ===== VERIFY TOKEN =====

  it('verifyToken → debería verificar token de autenticación', () => {
    const mockVerification = { valid: true, user: mockUsers[0] };

    service.verifyToken().subscribe(data => {
      expect(data).toEqual(mockVerification);
      expect(data.valid).toBeTrue();
    });

    const req = httpMock.expectOne(`${apiUrl}/verify-token`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(mockVerification);
  });

  // ===== AUTENTICACIÓN =====

  it('debería incluir token de autenticación en headers', () => {
    service.getAllUsers().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush([]);
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getAllUsers().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    req.flush('Error del servidor', { status: 500, statusText: 'Server Error' });
  });

  it('changePassword → debería manejar error de contraseña incorrecta', () => {
    service.changePassword(1, 'wrongPassword', 'newPassword').subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(401);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/change-password/1`);
    req.flush({ message: 'Contraseña actual incorrecta' }, { status: 401, statusText: 'Unauthorized' });
  });
});