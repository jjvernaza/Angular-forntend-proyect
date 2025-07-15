import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService - NetRoots VozIP', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockUser = {
    id: 1,
    nombre: 'Juan Carlos',
    apellidos: 'Vernaza Mayor',
    user: 'jvernaza',
    funcion: 'Administrador',
    telefono: '3001234567',
    email: 'admin@vozip.com'
  };

  const mockUsers = [
    mockUser,
    { id: 2, nombre: 'María', apellidos: 'López García', user: 'mlopez', funcion: 'Empleado', telefono: '3159876543', email: 'empleado@vozip.com' },
    { id: 3, nombre: 'Carlos', apellidos: 'Técnico Rural', user: 'ctecnico', funcion: 'Técnico', telefono: '3187654321', email: 'tecnico@vozip.com' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all users VozIP', () => {
    service.getAllUsers().subscribe(users => {
      expect(users.length).toBe(3);
      expect(users[0].funcion).toBe('Administrador');
      expect(users[1].funcion).toBe('Empleado');
      expect(users[2].funcion).toBe('Técnico');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/all');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('should get user by ID', () => {
    service.getUserById(1).subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(user.apellidos).toBe('Vernaza Mayor');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should create new VozIP user', () => {
    const newUser = {
      nombre: 'Ana',
      apellidos: 'Rodríguez Silva',
      user: 'arodriguez',
      password: 'vozip2024',
      funcion: 'Contador',
      telefono: '3201234567',
      email: 'contador@vozip.com'
    };

    service.createUser(newUser).subscribe(response => {
      expect(response.nombre).toBe('Ana');
      expect(response.funcion).toBe('Contador');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/create');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newUser);
    req.flush({ ...newUser, id: 4 });
  });

  it('should update user information', () => {
    const updatedUser = { ...mockUser, telefono: '3007654321' };

    service.updateUser(1, updatedUser).subscribe(response => {
      expect(response.telefono).toBe('3007654321');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/update/1');
    expect(req.request.method).toBe('PUT');
    req.flush(updatedUser);
  });

  it('should change user password', () => {
    const currentPassword = 'oldpass123';
    const newPassword = 'newpass456';

    service.changePassword(1, currentPassword, newPassword).subscribe(response => {
      expect(response.message).toBe('Contraseña actualizada');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/change-password/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ currentPassword, newPassword });
    req.flush({ message: 'Contraseña actualizada' });
  });

  it('should delete user', () => {
    service.deleteUser(2).subscribe(response => {
      expect(response.message).toBe('Usuario eliminado');
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/delete/2');
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Usuario eliminado' });
  });

  it('should verify token', () => {
    const mockVerification = {
      message: 'Token válido',
      user: mockUser
    };

    service.verifyToken().subscribe(response => {
      expect(response.message).toBe('Token válido');
      expect(response.user).toEqual(mockUser);
    });

    const req = httpMock.expectOne('http://localhost:3000/api/users/verify-token');
    expect(req.request.method).toBe('GET');
    req.flush(mockVerification);
  });

  describe('VozIP Specific User Roles', () => {
    it('should handle rural technician user', () => {
      const techUser = {
        id: 3,
        nombre: 'Pedro',
        apellidos: 'Instalador Rural',
        user: 'pinstalador',
        funcion: 'Técnico Instalador',
        telefono: '3156789012',
        email: 'instalador@vozip.com'
      };

      service.getUserById(3).subscribe(user => {
        expect(user.funcion).toContain('Técnico');
        expect(user.apellidos).toContain('Rural');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/3');
      req.flush(techUser);
    });

    it('should handle admin user with full permissions', () => {
      const adminUser = {
        ...mockUser,
        funcion: 'Administrador General',
        email: 'gerencia@vozip.com'
      };

      service.getUserById(1).subscribe(user => {
        expect(user.funcion).toContain('Administrador');
        expect(user.email).toContain('gerencia');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/users/1');
      req.flush(adminUser);
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication error', () => {
      service.verifyToken().subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(401);
          expect(error.statusText).toBe('Unauthorized');
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/verify-token');
      req.flush('Token invalid', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle password change error', () => {
      service.changePassword(1, 'wrong', 'new').subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Bad Request');
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/change-password/1');
      req.flush('Invalid current password', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle user creation conflict', () => {
      const duplicateUser = { ...mockUser, user: 'existing_user' };

      service.createUser(duplicateUser).subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(409);
          expect(error.statusText).toBe('Conflict');
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/users/create');
      req.flush('User already exists', { status: 409, statusText: 'Conflict' });
    });
  });
});