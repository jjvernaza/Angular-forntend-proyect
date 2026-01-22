import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AdministrarUsuariosComponent } from './administrar-usuarios.component';
import { UserService } from '../services/user.service';
import { PermisoService } from '../services/permiso.service';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

describe('AdministrarUsuariosComponent', () => {
  let component: AdministrarUsuariosComponent;
  let fixture: ComponentFixture<AdministrarUsuariosComponent>;

  let userServiceSpy: jasmine.SpyObj<UserService>;
  let permisoServiceSpy: jasmine.SpyObj<PermisoService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj<UserService>('UserService', [
      'getAllUsers',
      'updateUser',
      'deleteUser'
    ]);

    permisoServiceSpy = jasmine.createSpyObj<PermisoService>('PermisoService', [
      'getAllPermisos',
      'getPermisosByUsuario',
      'assignPermiso',
      'revokePermisoUsuario'
    ]);

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission']);

    apiServiceSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getEstados']);

    await TestBed.configureTestingModule({
      imports: [AdministrarUsuariosComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: PermisoService, useValue: permisoServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdministrarUsuariosComponent);
    component = fixture.componentInstance;
  });

  function mockPermisos({
    leer = true,
    actualizar = true,
    gestionar = true,
    eliminar = true
  } = {}) {
    authServiceSpy.hasPermission.and.callFake((p: string) => {
      const map: Record<string, boolean> = {
        'usuarios.leer': leer,
        'usuarios.actualizar': actualizar,
        'usuarios.asignar_permisos': gestionar,
        'usuarios.eliminar': eliminar
      };
      return !!map[p];
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit: si tiene permiso leer, carga usuarios + estados y permisos si aplica', () => {
    mockPermisos({ leer: true, gestionar: true });

    const usuariosMock = [{ ID: 1, Nombre: 'Juan', estado_id: 1 }];
    const estadosMock = [{ ID: 1, Estado: 'Activo' }];
    const permisosMock = [{ id: 10, nombre: 'X' }];

    userServiceSpy.getAllUsers.and.returnValue(of(usuariosMock as any));
    apiServiceSpy.getEstados.and.returnValue(of(estadosMock as any));
    permisoServiceSpy.getAllPermisos.and.returnValue(of(permisosMock as any));

    spyOn(component, 'aplicarFiltros').and.callThrough();

    component.ngOnInit();

    expect(userServiceSpy.getAllUsers).toHaveBeenCalled();
    expect(apiServiceSpy.getEstados).toHaveBeenCalled();
    expect(permisoServiceSpy.getAllPermisos).toHaveBeenCalled();
    expect(component.aplicarFiltros).toHaveBeenCalled();
  });

  it('ngOnInit: si NO tiene permiso leer, no carga nada', () => {
    mockPermisos({ leer: false, gestionar: true });

    component.ngOnInit();

    expect(userServiceSpy.getAllUsers).not.toHaveBeenCalled();
    expect(apiServiceSpy.getEstados).not.toHaveBeenCalled();
    expect(permisoServiceSpy.getAllPermisos).not.toHaveBeenCalled();
  });

  it('aplicarFiltros: filtra por texto (Nombre/User/Cedula/etc.)', () => {
    component.usuarios = [
      { ID: 1, Nombre: 'Juan', Apellidos: 'Vernaza', User: 'juan', Cedula: 123, Funcion: 'Dev', estado_id: 1 },
      { ID: 2, Nombre: 'Ana', Apellidos: 'Lopez', User: 'ana', Cedula: 999, Funcion: 'Marketing', estado_id: 2 },
    ];

    component.textoBusqueda = 'vern';
    component.filtroEstado = 'todos';

    component.aplicarFiltros();

    expect(component.usuariosFiltrados.length).toBe(1);
    expect(component.usuariosFiltrados[0].ID).toBe(1);
  });

  it('aplicarFiltros: filtra por estado cuando filtroEstado != "todos"', () => {
    component.estados = [
      { ID: 1, Estado: 'Activo' },
      { ID: 2, Estado: 'Inactivo' }
    ];

    component.usuarios = [
      { ID: 1, Nombre: 'Juan', estado_id: 1 },
      { ID: 2, Nombre: 'Ana', estado_id: 2 }
    ];

    component.textoBusqueda = '';
    component.filtroEstado = 'Activo';

    component.aplicarFiltros();

    expect(component.usuariosFiltrados.length).toBe(1);
    expect(component.usuariosFiltrados[0].ID).toBe(1);
  });

  it('getEstadoNombre: retorna "Desconocido" si no existe', () => {
    component.estados = [{ ID: 1, Estado: 'Activo' }];
    expect(component.getEstadoNombre(999)).toBe('Desconocido');
  });

  it('getEstadoClase: Activo => green, otro => red', () => {
    component.estados = [
      { ID: 1, Estado: 'Activo' },
      { ID: 2, Estado: 'Inactivo' }
    ];

    expect(component.getEstadoClase(1)).toContain('text-green');
    expect(component.getEstadoClase(2)).toContain('text-red');
  });

  // ✅ OPCIONAL: prueba rápida para el guard clause del permiso
  it('guardarEdicion: sin permiso, muestra alert y no llama updateUser', () => {
    component.tienePermisoActualizar = false;
    spyOn(window, 'alert');

    component.usuarioEditando = { ID: 10, estado_id: '1' };

    component.guardarEdicion();

    expect(window.alert).toHaveBeenCalled();
    expect(userServiceSpy.updateUser).not.toHaveBeenCalled();
  });

  it('guardarEdicion: con permiso actualizar, llama updateUser y recarga usuarios (éxito)', fakeAsync(() => {
    // ✅ IMPORTANTE: este flag es el que controla el guard clause
    component.tienePermisoActualizar = true;

    component.usuarioEditando = {
      ID: 10,
      Nombre: 'Juan',
      Apellidos: 'V',
      Cedula: 123,
      Telefono: '300',
      Funcion: 'Dev',
      User: 'juan',
      estado_id: '1'
    };

    userServiceSpy.updateUser.and.returnValue(of({} as any));
    userServiceSpy.getAllUsers.and.returnValue(of([] as any)); // para cargarUsuarios()

    spyOn(component, 'cargarUsuarios').and.callThrough();

    component.guardarEdicion();
    tick();

    expect(userServiceSpy.updateUser).toHaveBeenCalledWith(
      10,
      jasmine.objectContaining({ Nombre: 'Juan', estado_id: 1 })
    );

    expect(component.successMessage).toBe('Usuario actualizado correctamente');
    expect(component.mostrarModalEditar).toBeFalse();
    expect(component.cargarUsuarios).toHaveBeenCalled();

    tick(3000);
    expect(component.successMessage).toBe('');
  }));

  it('guardarEdicion: si falla, setea errorMessage', fakeAsync(() => {
    component.tienePermisoActualizar = true;

    component.usuarioEditando = {
      ID: 10,
      Nombre: 'Juan',
      Apellidos: 'V',
      Cedula: 123,
      Telefono: '300',
      Funcion: 'Dev',
      User: 'juan',
      estado_id: '1'
    };

    userServiceSpy.updateUser.and.returnValue(
      throwError(() => ({ error: { message: 'Fallo backend' } }))
    );

    component.guardarEdicion();
    tick();

    expect(component.errorMessage).toBe('Fallo backend');
    expect(component.isSubmitting).toBeFalse();
  }));

  it('togglePermiso: si ya lo tiene, llama revocarPermiso; si no, llama asignarPermiso', () => {
    component.tienePermisoGestionarPermisos = true;
    component.usuarioSeleccionado = { ID: 99 };
    component.usuarioPermisosAsignados = [1];

    spyOn(component, 'revocarPermiso');
    spyOn(component, 'asignarPermiso');

    component.togglePermiso(1);
    expect(component.revocarPermiso).toHaveBeenCalledWith(1);

    component.togglePermiso(2);
    expect(component.asignarPermiso).toHaveBeenCalledWith(2);
  });
});
