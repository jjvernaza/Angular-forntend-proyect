// src/app/services/permiso.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PermisoService } from './permiso.service';

describe('PermisoService', () => {
  let service: PermisoService;
  let httpMock: HttpTestingController;
  const apiUrl = 'http://localhost:3000/api/permisos';
  const usuarioPermisoUrl = 'http://localhost:3000/api/usuario-permisos';

  const mockPermisos = [
    { id: 1, nombre: 'usuarios.leer', descripcion: 'Ver usuarios' },
    { id: 2, nombre: 'usuarios.crear', descripcion: 'Crear usuarios' }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PermisoService]
    });
    service = TestBed.inject(PermisoService);
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

  // ===== PERMISOS CRUD =====

  it('getAllPermisos → debería obtener todos los permisos', () => {
    service.getAllPermisos().subscribe(data => {
      expect(data).toEqual(mockPermisos);
      expect(data.length).toBe(2);
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush(mockPermisos);
  });

  it('getPermisoById → debería obtener permiso por ID', () => {
    const mockPermiso = mockPermisos[0];

    service.getPermisoById(1).subscribe(data => {
      expect(data).toEqual(mockPermiso);
      expect(data.nombre).toBe('usuarios.leer');
    });

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPermiso);
  });

  it('createPermiso → debería crear nuevo permiso', () => {
    const newPermiso = { nombre: 'clientes.leer', descripcion: 'Ver clientes' };

    service.createPermiso(newPermiso).subscribe(data => {
      expect(data).toEqual({ id: 3, ...newPermiso });
    });

    const req = httpMock.expectOne(`${apiUrl}/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newPermiso);
    req.flush({ id: 3, ...newPermiso });
  });

  it('updatePermiso → debería actualizar permiso', () => {
    const updatedPermiso = { nombre: 'usuarios.actualizar', descripcion: 'Updated' };

    service.updatePermiso(1, updatedPermiso).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/update/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatedPermiso);
    req.flush({ success: true });
  });

  it('deletePermiso → debería eliminar permiso', () => {
    service.deletePermiso(1).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${apiUrl}/delete/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ===== USUARIO-PERMISO OPERATIONS =====

  it('getPermisosByUsuario → debería obtener permisos de usuario', () => {
    const mockUserPermisos = [
      { id: 1, permiso_id: 1, nombre: 'usuarios.leer' }
    ];

    service.getPermisosByUsuario(1).subscribe(data => {
      expect(data).toEqual(mockUserPermisos);
    });

    const req = httpMock.expectOne(`${usuarioPermisoUrl}/usuario/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUserPermisos);
  });

  it('getUsuariosByPermiso → debería obtener usuarios con permiso', () => {
    const mockUsers = [
      { id: 1, usuario_id: 1, nombre: 'Juan' }
    ];

    service.getUsuariosByPermiso(1).subscribe(data => {
      expect(data).toEqual(mockUsers);
    });

    const req = httpMock.expectOne(`${usuarioPermisoUrl}/permiso/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  it('assignPermiso → debería asignar permiso a usuario', () => {
    service.assignPermiso(1, 2).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${usuarioPermisoUrl}/assign`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ usuario_id: 1, permiso_id: 2 });
    req.flush({ success: true });
  });

  it('revokePermiso → debería revocar permiso por asignación ID', () => {
    service.revokePermiso(10).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${usuarioPermisoUrl}/revoke/10`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('revokePermisoUsuario → debería revocar permiso específico de usuario', () => {
    service.revokePermisoUsuario(1, 2).subscribe(data => {
      expect(data).toBeTruthy();
    });

    const req = httpMock.expectOne(`${usuarioPermisoUrl}/revoke/usuario/1/permiso/2`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  // ===== AUTENTICACIÓN =====

  it('debería incluir token de autenticación en headers', () => {
    service.getAllPermisos().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/all`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush([]);
  });

  // ===== MANEJO DE ERRORES =====

  it('debería manejar errores HTTP', () => {
    service.getAllPermisos().subscribe({
      next: () => fail('debería haber fallado'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(`${apiUrl}/all`);
    req.flush('Error del servidor', { status: 500, statusText: 'Server Error' });
  });
});