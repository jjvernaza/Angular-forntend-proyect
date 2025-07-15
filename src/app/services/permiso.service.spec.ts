// src/app/services/permiso.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PermisoService } from './permiso.service';

describe('PermisoService - NetRoots VozIP', () => {
  let service: PermisoService;
  let httpMock: HttpTestingController;

  const mockPermiso = {
    id: 1,
    nombre: 'dashboard',
    descripcion: 'Acceso al panel principal de VozIP'
  };

  const mockPermisos = [
    mockPermiso,
    { id: 2, nombre: 'clientes', descripcion: 'Gestión de clientes rurales' },
    { id: 3, nombre: 'pagos', descripcion: 'Gestión de pagos y morosos' },
    { id: 4, nombre: 'servicios', descripcion: 'Gestión de servicios de telecomunicaciones' }
  ];

  const mockUsuarioPermiso = {
    id: 1,
    usuario_id: 1,
    permiso_id: 1,
    fecha_asignacion: '2024-01-15'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PermisoService]
    });
    service = TestBed.inject(PermisoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Permisos CRUD', () => {
    it('should get all permisos NetRoots', () => {
      service.getAllPermisos().subscribe(permisos => {
        expect(permisos.length).toBe(4);
        expect(permisos[0].nombre).toBe('dashboard');
        expect(permisos[1].descripcion).toContain('rurales');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/permisos/all');
      expect(req.request.method).toBe('GET');
      req.flush(mockPermisos);
    });

    it('should get permiso by ID', () => {
      service.getPermisoById(1).subscribe(permiso => {
        expect(permiso).toEqual(mockPermiso);
        expect(permiso.nombre).toBe('dashboard');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/permisos/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockPermiso);
    });

    it('should create new permiso for VozIP roles', () => {
      const newPermiso = {
        nombre: 'morosos',
        descripcion: 'Gestión de clientes morosos rurales'
      };

      service.createPermiso(newPermiso).subscribe(response => {
        expect(response.nombre).toBe('morosos');
        expect(response.descripcion).toContain('morosos rurales');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/permisos/create');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newPermiso);
      req.flush({ ...newPermiso, id: 5 });
    });

    it('should update permiso', () => {
      const updatedPermiso = { ...mockPermiso, descripcion: 'Dashboard VozIP actualizado' };

      service.updatePermiso(1, updatedPermiso).subscribe(response => {
        expect(response.descripcion).toBe('Dashboard VozIP actualizado');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/permisos/update/1');
      expect(req.request.method).toBe('PUT');
      req.flush(updatedPermiso);
    });

    it('should delete permiso', () => {
      service.deletePermiso(1).subscribe(response => {
        expect(response.message).toBe('Permiso eliminado');
      });

      const req = httpMock.expectOne('http://localhost:3000/api/permisos/delete/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Permiso eliminado' });
    });
  });

  describe('Usuario-Permiso Operations', () => {
    it('should get permisos by usuario VozIP', () => {
      const usuarioId = 1;
      const mockPermisoUsuario = [
        { ...mockPermiso, fecha_asignacion: '2024-01-15' },
        { id: 2, nombre: 'clientes', descripcion: 'Clientes rurales', fecha_asignacion: '2024-01-15' }
      ];

      service.getPermisosByUsuario(usuarioId).subscribe(permisos => {
        expect(permisos.length).toBe(2);
        expect(permisos[0].nombre).toBe('dashboard');
        expect(permisos[1].nombre).toBe('clientes');
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/usuario-permisos/usuario/${usuarioId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPermisoUsuario);
    });

    it('should get usuarios by permiso', () => {
      const permisoId = 1;
      const mockUsuarios = [
        { id: 1, nombre: 'Juan Carlos', funcion: 'Administrador' },
        { id: 2, nombre: 'María López', funcion: 'Empleado' }
      ];

      service.getUsuariosByPermiso(permisoId).subscribe(usuarios => {
        expect(usuarios.length).toBe(2);
        expect(usuarios[0].funcion).toBe('Administrador');
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/usuario-permisos/permiso/${permisoId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsuarios);
    });

    it('should assign permiso to usuario VozIP', () => {
      const usuarioId = 1;
      const permisoId = 3;

      service.assignPermiso(usuarioId, permisoId).subscribe(response => {
        expect(response.usuario_id).toBe(usuarioId);
        expect(response.permiso_id).toBe(permisoId);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/usuario-permisos/assign');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ usuario_id: usuarioId, permiso_id: permisoId });
      req.flush({ ...mockUsuarioPermiso, usuario_id: usuarioId, permiso_id: permisoId });
    });

    it('should revoke permiso by asignacion ID', () => {
      const asignacionId = 1;

      service.revokePermiso(asignacionId).subscribe(response => {
        expect(response.message).toBe('Permiso revocado');
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/usuario-permisos/revoke/${asignacionId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Permiso revocado' });
    });

    it('should revoke permiso by usuario and permiso ID', () => {
      const usuarioId = 1;
      const permisoId = 2;

      service.revokePermisoUsuario(usuarioId, permisoId).subscribe(response => {
        expect(response.message).toBe('Permiso revocado del usuario');
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/usuario-permisos/revoke/usuario/${usuarioId}/permiso/${permisoId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Permiso revocado del usuario' });
    });
  });

  describe('VozIP Specific Permission Scenarios', () => {
    it('should handle rural technician permissions', () => {
      const techPermissions = [
        { id: 1, nombre: 'servicios', descripcion: 'Instalación servicios rurales' },
        { id: 2, nombre: 'clientes', descripcion: 'Consulta clientes para instalación' }
      ];

      service.getPermisosByUsuario(2).subscribe(permissions => {
        expect(permissions[0].descripcion).toContain('rurales');
        expect(permissions.length).toBe(2);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/usuario-permisos/usuario/2');
      req.flush(techPermissions);
    });

    it('should handle admin permissions for VozIP management', () => {
      const adminPermissions = [
        { id: 1, nombre: 'dashboard', descripcion: 'Dashboard completo VozIP' },
        { id: 2, nombre: 'usuarios', descripcion: 'Gestión empleados rurales' },
        { id: 3, nombre: 'reportes', descripcion: 'Reportes financieros VozIP' }
      ];

      service.getPermisosByUsuario(1).subscribe(permissions => {
        expect(permissions.length).toBe(3);
        expect(permissions.some(p => p.nombre === 'usuarios')).toBeTruthy();
        expect(permissions.some(p => p.nombre === 'reportes')).toBeTruthy();
      });

      const req = httpMock.expectOne('http://localhost:3000/api/usuario-permisos/usuario/1');
      req.flush(adminPermissions);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors when getting permisos', () => {
      service.getAllPermisos().subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(500);
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/permisos/all');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle assignment errors', () => {
      service.assignPermiso(1, 1).subscribe(
        () => fail('Should have failed'),
        (error) => {
          expect(error.status).toBe(409);
          expect(error.statusText).toBe('Conflict');
        }
      );

      const req = httpMock.expectOne('http://localhost:3000/api/usuario-permisos/assign');
      req.flush('Permission already assigned', { status: 409, statusText: 'Conflict' });
    });
  });
});