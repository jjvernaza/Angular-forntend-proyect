import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { CrearUsuarioComponent } from './crear-usuario.component';
import { UserService } from '../services/user.service';
import { PermisoService } from '../services/permiso.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

describe('CrearUsuarioComponent', () => {
  let component: CrearUsuarioComponent;
  let fixture: ComponentFixture<CrearUsuarioComponent>;

  let userSpy: jasmine.SpyObj<UserService>;
  let permisoSpy: jasmine.SpyObj<PermisoService>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    userSpy = jasmine.createSpyObj<UserService>('UserService', ['createUser']);
    permisoSpy = jasmine.createSpyObj<PermisoService>('PermisoService', ['getAllPermisos', 'assignPermiso']);
    apiSpy = jasmine.createSpyObj<ApiService>('ApiService', ['getEstados']);
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['hasPermission']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    // defaults
    authSpy.hasPermission.and.returnValue(false);
    permisoSpy.getAllPermisos.and.returnValue(of([] as any));
    apiSpy.getEstados.and.returnValue(of([] as any));
    userSpy.createUser.and.returnValue(of({ usuario: { id: 1 } } as any));
    permisoSpy.assignPermiso.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [CrearUsuarioComponent],
      providers: [
        { provide: UserService, useValue: userSpy },
        { provide: PermisoService, useValue: permisoSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CrearUsuarioComponent);
    component = fixture.componentInstance;
  });

  function setPermisos({ crear = true, asignar = true } = {}) {
    authSpy.hasPermission.and.callFake((p: string) => {
      if (p === 'usuarios.crear') return crear;
      if (p === 'usuarios.asignar_permisos') return asignar;
      return false;
    });
  }

  function mockEstadosConActivo() {
    apiSpy.getEstados.and.returnValue(of([
      { ID: 1, Estado: 'Inactivo' },
      { ID: 2, Estado: 'Activo' },
    ] as any));
  }

  function fillValidForm() {
    component.usuarioForm.patchValue({
      Nombre: 'Juan',
      Apellidos: 'V',
      Cedula: '123456',
      Telefono: '3001234567',
      Funcion: 'Admin',
      User: 'juan',
      Password: '123456',
      estado_id: '2'
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.usuarioForm).toBeTruthy();
  });

  it('ngOnInit: sin permiso crear -> no carga estados ni permisos', () => {
    setPermisos({ crear: false, asignar: true });

    component.ngOnInit();

    expect(apiSpy.getEstados).not.toHaveBeenCalled();
    expect(permisoSpy.getAllPermisos).not.toHaveBeenCalled();
  });

  it('ngOnInit: con permiso crear y asignar -> carga permisos y estados + setea estado Activo por defecto', () => {
    setPermisos({ crear: true, asignar: true });
    mockEstadosConActivo();
    permisoSpy.getAllPermisos.and.returnValue(of([{ id: 1 }, { id: 2 }] as any));

    component.ngOnInit();

    expect(permisoSpy.getAllPermisos).toHaveBeenCalled();
    expect(apiSpy.getEstados).toHaveBeenCalled();

    // patchValue con "Activo"
    expect(component.usuarioForm.value.estado_id).toBe(2);
  });

  it('crearUsuario: sin permiso -> alerta y no llama createUser', () => {
    component.tienePermiso = false; // evita depender de ngOnInit
    spyOn(window, 'alert');

    component.crearUsuario();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear usuarios.');
    expect(userSpy.createUser).not.toHaveBeenCalled();
  });

  it('crearUsuario: form inválido -> marca touched y setea errorMessage', () => {
    setPermisos({ crear: true, asignar: true });
    component.tienePermiso = true;

    // form vacío => inválido
    component.crearUsuario();

    expect(component.errorMessage).toContain('Por favor, complete todos los campos requeridos.');
    expect(component.usuarioForm.get('Nombre')?.touched).toBeTrue();
    expect(userSpy.createUser).not.toHaveBeenCalled();
  });

  it('crearUsuario: éxito sin permisos seleccionados -> successMessage y resetForm', fakeAsync(() => {
    setPermisos({ crear: true, asignar: true });
    component.tienePermiso = true;
    component.tienePermisoAsignarPermisos = true;

    mockEstadosConActivo();
    component.estados = [
      { ID: 2, Estado: 'Activo' }
    ];

    fillValidForm();
    component.selectedPermisos = []; // sin permisos a asignar

    userSpy.createUser.and.returnValue(of({ usuario: { id: 10 } } as any));
    spyOn(component, 'resetForm').and.callThrough();

    component.crearUsuario();

    expect(userSpy.createUser).toHaveBeenCalled();
    const args = userSpy.createUser.calls.mostRecent().args[0] as any;
    expect(args.Nombre).toBe('Juan');
    expect(args.estado_id).toBe(2); // convertido a number

    expect(component.isSubmitting).toBeFalse();
    expect(component.successMessage).toBe('Usuario creado exitosamente.');
    expect(component.resetForm).toHaveBeenCalled();

    // se limpia en 5s
    tick(5000);
    expect(component.successMessage).toBe('');
  }));

  it('crearUsuario: éxito con permisos seleccionados y con permiso asignar -> llama assignPermisosToUser', () => {
    setPermisos({ crear: true, asignar: true });
    component.tienePermiso = true;
    component.tienePermisoAsignarPermisos = true;

    fillValidForm();
    component.selectedPermisos = [1, 2];

    userSpy.createUser.and.returnValue(of({ usuario: { id: 99 } } as any));
    spyOn(component, 'assignPermisosToUser');

    component.crearUsuario();

    expect(userSpy.createUser).toHaveBeenCalled();
    expect(component.assignPermisosToUser).toHaveBeenCalledWith(99);
  });

  it('crearUsuario: error 409 -> setea mensaje específico', () => {
    setPermisos({ crear: true, asignar: false });
    component.tienePermiso = true;

    fillValidForm();
    userSpy.createUser.and.returnValue(throwError(() => ({ status: 409 })));

    component.crearUsuario();

    expect(component.isSubmitting).toBeFalse();
    expect(component.errorMessage).toBe('Ya existe un usuario con ese nombre de usuario o cédula.');
  });

  it('togglePermiso: sin permiso asignar -> alerta y no cambia lista', () => {
    component.tienePermisoAsignarPermisos = false;
    spyOn(window, 'alert');

    component.selectedPermisos = [1];
    component.togglePermiso(2);

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para asignar permisos a otros usuarios.');
    expect(component.selectedPermisos).toEqual([1]);
  });

  it('togglePermiso: agrega y remueve', () => {
    component.tienePermisoAsignarPermisos = true;

    component.selectedPermisos = [];
    component.togglePermiso(10);
    expect(component.selectedPermisos).toEqual([10]);

    component.togglePermiso(10);
    expect(component.selectedPermisos).toEqual([]);
  });

  it('isPermisoSelected', () => {
    component.selectedPermisos = [5];
    expect(component.isPermisoSelected(5)).toBeTrue();
    expect(component.isPermisoSelected(99)).toBeFalse();
  });

  it('assignPermisosToUser: asigna todos -> success y resetForm', fakeAsync(() => {
    component.tienePermisoAsignarPermisos = true;
    component.selectedPermisos = [1, 2];

    // estados para resetForm
    component.estados = [{ ID: 2, Estado: 'Activo' }];

    permisoSpy.assignPermiso.and.returnValue(of({ ok: true } as any));
    spyOn(component, 'resetForm').and.callThrough();

    component.isSubmitting = true;
    component.assignPermisosToUser(100);

    expect(permisoSpy.assignPermiso).toHaveBeenCalledTimes(2);

    // callbacks sync porque usamos of()
    expect(component.isSubmitting).toBeFalse();
    expect(component.successMessage).toContain('Usuario creado exitosamente con todos los permisos asignados.');
    expect(component.resetForm).toHaveBeenCalled();

    tick(5000);
    expect(component.successMessage).toBe('');
  }));

  it('assignPermisosToUser: error asignando -> setea errorMessage', () => {
    component.tienePermisoAsignarPermisos = true;
    component.selectedPermisos = [1];

    permisoSpy.assignPermiso.and.returnValue(
      throwError(() => ({ error: { message: 'Fallo permiso' } }))
    );

    component.isSubmitting = true;
    component.assignPermisosToUser(100);

    expect(component.isSubmitting).toBeFalse();
    expect(component.errorMessage).toContain('Usuario creado, pero hubo un error al asignar el permiso');
  });

  it('resetForm: limpia form y permisos y setea estado activo si existe', () => {
    component.estados = [{ ID: 2, Estado: 'Activo' }];
    fillValidForm();
    component.selectedPermisos = [1, 2];

    component.resetForm();

    expect(component.selectedPermisos.length).toBe(0);
    expect(component.usuarioForm.value.estado_id).toBe(2);
  });

  it('getFormErrors: true cuando invalid + touched/dirty', () => {
    const control = component.usuarioForm.get('Nombre');
    control?.setValue('');
    control?.markAsTouched();

    expect(component.getFormErrors('Nombre')).toBeTrue();

    control?.setValue('ok');
    expect(component.getFormErrors('Nombre')).toBeFalse();
  });
});
