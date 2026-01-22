// src/app/permisos/permisos.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PermisosComponent } from './permisos.component';
import { PermisoService } from '../services/permiso.service';
import { AuthService } from '../services/auth.service';

describe('PermisosComponent', () => {
  let component: PermisosComponent;
  let fixture: ComponentFixture<PermisosComponent>;
  let permisoServiceSpy: jasmine.SpyObj<PermisoService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockPermisos = [
    { id: 1, nombre: 'usuarios.leer', descripcion: 'Ver usuarios' },
    { id: 2, nombre: 'usuarios.crear', descripcion: 'Crear usuarios' }
  ];

  beforeEach(async () => {
    permisoServiceSpy = jasmine.createSpyObj('PermisoService', [
      'getAllPermisos',
      'createPermiso',
      'updatePermiso',
      'deletePermiso',
      'getUsuariosByPermiso',
      'revokePermiso'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);

    await TestBed.configureTestingModule({
      imports: [PermisosComponent, ReactiveFormsModule],
      providers: [
        { provide: PermisoService, useValue: permisoServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PermisosComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit → debería cargar permisos si tiene permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(true);
    permisoServiceSpy.getAllPermisos.and.returnValue(of(mockPermisos));

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeTrue();
    expect(permisoServiceSpy.getAllPermisos).toHaveBeenCalled();
    expect(component.permisos.length).toBe(2);
  });

  it('ngOnInit → NO debería cargar permisos sin permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(false);

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeFalse();
    expect(permisoServiceSpy.getAllPermisos).not.toHaveBeenCalled();
  });

  it('guardarPermiso → debería crear permiso nuevo', fakeAsync(() => {
    component.tienePermisoCrear = true;
    component.permisoForm.setValue({ nombre: 'test.permiso', descripcion: 'Test' });
    permisoServiceSpy.createPermiso.and.returnValue(of({}));
    permisoServiceSpy.getAllPermisos.and.returnValue(of(mockPermisos));

    component.guardarPermiso();
    tick();

    expect(permisoServiceSpy.createPermiso).toHaveBeenCalledWith({
      nombre: 'test.permiso',
      descripcion: 'Test'
    });
    expect(component.successMessage).toBe('Permiso creado correctamente');
  }));

  it('guardarPermiso → debería actualizar permiso en modo edición', fakeAsync(() => {
    component.tienePermisoActualizar = true;
    component.modoEdicion = true;
    component.permisoEditando = { id: 1 };
    component.permisoForm.setValue({ nombre: 'test.updated', descripcion: 'Updated' });
    permisoServiceSpy.updatePermiso.and.returnValue(of({}));
    permisoServiceSpy.getAllPermisos.and.returnValue(of(mockPermisos));

    component.guardarPermiso();
    tick();

    expect(permisoServiceSpy.updatePermiso).toHaveBeenCalledWith(1, {
      nombre: 'test.updated',
      descripcion: 'Updated'
    });
    expect(component.successMessage).toBe('Permiso actualizado correctamente');
  }));

  it('guardarPermiso → NO debería crear si no tiene permisos', () => {
    component.tienePermisoCrear = false;
    spyOn(window, 'alert');

    component.guardarPermiso();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear permisos.');
    expect(permisoServiceSpy.createPermiso).not.toHaveBeenCalled();
  });

  it('editarPermiso → debería cargar datos en formulario', () => {
    component.tienePermisoActualizar = true;
    const permiso = { id: 1, nombre: 'test.permiso', descripcion: 'Test' };

    component.editarPermiso(permiso);

    expect(component.modoEdicion).toBeTrue();
    expect(component.permisoEditando).toEqual(permiso);
    expect(component.permisoForm.value.nombre).toBe('test.permiso');
  });

  it('eliminarPermiso → debería eliminar permiso', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.permisoAEliminar = { id: 1 };
    permisoServiceSpy.deletePermiso.and.returnValue(of({}));
    permisoServiceSpy.getAllPermisos.and.returnValue(of(mockPermisos));

    component.eliminarPermiso();
    tick();

    expect(permisoServiceSpy.deletePermiso).toHaveBeenCalledWith(1);
    expect(component.showConfirmModal).toBeFalse();
    expect(component.successMessage).toBe('Permiso eliminado correctamente');
  }));

  it('eliminarPermiso → debería manejar error de conflicto', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.permisoAEliminar = { id: 1 };
    permisoServiceSpy.deletePermiso.and.returnValue(
      throwError(() => ({ status: 409 }))
    );

    component.eliminarPermiso();
    tick();

    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toContain('está asignado');
  }));

  it('verUsuariosAsignados → debería cargar usuarios con permiso', fakeAsync(() => {
    component.tienePermisoLeer = true;
    const mockUsuarios = [{ id: 1, nombre: 'Juan', username: 'juan' }];
    permisoServiceSpy.getUsuariosByPermiso.and.returnValue(of(mockUsuarios));

    component.verUsuariosAsignados({ id: 1, nombre: 'test.permiso' });
    tick();

    expect(component.showUsuariosModal).toBeTrue();
    expect(component.usuariosConPermiso.length).toBe(1);
  }));

  it('revocarPermiso → debería revocar permiso de usuario', fakeAsync(() => {
    component.tienePermisoRevocar = true;
    component.usuariosConPermiso = [
      { id: 1, nombre: 'Juan' },
      { id: 2, nombre: 'María' }
    ];
    permisoServiceSpy.revokePermiso.and.returnValue(of({}));

    component.revocarPermiso(1);
    tick();

    expect(permisoServiceSpy.revokePermiso).toHaveBeenCalledWith(1);
    expect(component.usuariosConPermiso.length).toBe(1);
  }));

  it('cancelarEdicion → debería resetear formulario', () => {
    component.modoEdicion = true;
    component.permisoEditando = { id: 1 };

    component.cancelarEdicion();

    expect(component.modoEdicion).toBeFalse();
    expect(component.permisoEditando).toBeNull();
  });
});