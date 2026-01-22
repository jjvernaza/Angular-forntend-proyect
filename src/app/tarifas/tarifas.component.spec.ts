// src/app/tarifas/tarifas.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TarifasComponent } from './tarifas.component';
import { TarifaService } from '../services/tarifa.service';
import { AuthService } from '../services/auth.service';

describe('TarifasComponent', () => {
  let component: TarifasComponent;
  let fixture: ComponentFixture<TarifasComponent>;
  let tarifaServiceSpy: jasmine.SpyObj<TarifaService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockTarifas = [
    { id: 1, valor: 50000 },
    { id: 2, valor: 80000 }
  ];

  beforeEach(async () => {
    tarifaServiceSpy = jasmine.createSpyObj('TarifaService', [
      'getAllTarifas',
      'createTarifa',
      'updateTarifa',
      'deleteTarifa'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);

    await TestBed.configureTestingModule({
      imports: [TarifasComponent, ReactiveFormsModule],
      providers: [
        { provide: TarifaService, useValue: tarifaServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TarifasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit → debería cargar tarifas si tiene permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(true);
    tarifaServiceSpy.getAllTarifas.and.returnValue(of(mockTarifas));

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeTrue();
    expect(tarifaServiceSpy.getAllTarifas).toHaveBeenCalled();
    expect(component.tarifas.length).toBe(2);
  });

  it('ngOnInit → NO debería cargar tarifas sin permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(false);

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeFalse();
    expect(tarifaServiceSpy.getAllTarifas).not.toHaveBeenCalled();
  });

  it('guardarTarifa → debería crear tarifa nueva', fakeAsync(() => {
    component.tienePermisoCrear = true;
    component.tarifaForm.setValue({ valor: 100000 });
    tarifaServiceSpy.createTarifa.and.returnValue(of({}));
    tarifaServiceSpy.getAllTarifas.and.returnValue(of(mockTarifas));

    component.guardarTarifa();
    tick();

    expect(tarifaServiceSpy.createTarifa).toHaveBeenCalledWith({ valor: 100000 });
    expect(component.successMessage).toBe('Tarifa creada correctamente');
  }));

  it('guardarTarifa → debería actualizar tarifa en modo edición', fakeAsync(() => {
    component.tienePermisoActualizar = true;
    component.modoEdicion = true;
    component.tarifaEditando = { id: 1 };
    component.tarifaForm.setValue({ valor: 120000 });
    tarifaServiceSpy.updateTarifa.and.returnValue(of({}));
    tarifaServiceSpy.getAllTarifas.and.returnValue(of(mockTarifas));

    component.guardarTarifa();
    tick();

    expect(tarifaServiceSpy.updateTarifa).toHaveBeenCalledWith(1, { valor: 120000 });
    expect(component.successMessage).toBe('Tarifa actualizada correctamente');
  }));

  it('guardarTarifa → NO debería crear si no tiene permisos', () => {
    component.tienePermisoCrear = false;
    spyOn(window, 'alert');

    component.guardarTarifa();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear tarifas.');
    expect(tarifaServiceSpy.createTarifa).not.toHaveBeenCalled();
  });

  it('guardarTarifa → NO debería enviar si formulario es inválido', () => {
    component.tienePermisoCrear = true;
    component.tarifaForm.setValue({ valor: '' });

    component.guardarTarifa();

    expect(component.submitted).toBeTrue();
    expect(tarifaServiceSpy.createTarifa).not.toHaveBeenCalled();
  });

  it('guardarTarifa → debería validar valor mínimo', () => {
    component.tienePermisoCrear = true;
    component.tarifaForm.setValue({ valor: 0 });

    component.guardarTarifa();

    expect(component.tarifaForm.invalid).toBeTrue();
    expect(tarifaServiceSpy.createTarifa).not.toHaveBeenCalled();
  });

  it('editarTarifa → debería cargar datos en formulario', () => {
    component.tienePermisoActualizar = true;
    const tarifa = { id: 1, valor: 50000 };

    component.editarTarifa(tarifa);

    expect(component.modoEdicion).toBeTrue();
    expect(component.tarifaEditando).toEqual(tarifa);
    expect(component.tarifaForm.value.valor).toBe(50000);
  });

  it('editarTarifa → NO debería editar sin permisos', () => {
    component.tienePermisoActualizar = false;
    spyOn(window, 'alert');

    component.editarTarifa({ id: 1 });

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para editar tarifas.');
    expect(component.modoEdicion).toBeFalse();
  });

  it('eliminarTarifa → debería eliminar tarifa', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.tarifaAEliminar = { id: 1 };
    tarifaServiceSpy.deleteTarifa.and.returnValue(of({}));
    tarifaServiceSpy.getAllTarifas.and.returnValue(of(mockTarifas));

    component.eliminarTarifa();
    tick();

    expect(tarifaServiceSpy.deleteTarifa).toHaveBeenCalledWith(1);
    expect(component.showConfirmModal).toBeFalse();
    expect(component.successMessage).toBe('Tarifa eliminada correctamente');
  }));

  it('eliminarTarifa → debería manejar error de conflicto', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.tarifaAEliminar = { id: 1 };
    tarifaServiceSpy.deleteTarifa.and.returnValue(
      throwError(() => ({ status: 409 }))
    );

    component.eliminarTarifa();
    tick();

    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toContain('está siendo utilizada');
  }));

  it('confirmarEliminar → debería mostrar modal de confirmación', () => {
    component.tienePermisoEliminar = true;
    const tarifa = { id: 1, valor: 50000 };

    component.confirmarEliminar(tarifa);

    expect(component.showConfirmModal).toBeTrue();
    expect(component.tarifaAEliminar).toEqual(tarifa);
  });

  it('cancelarEliminacion → debería cerrar modal', () => {
    component.showConfirmModal = true;
    component.tarifaAEliminar = { id: 1 };

    component.cancelarEliminacion();

    expect(component.showConfirmModal).toBeFalse();
    expect(component.tarifaAEliminar).toBeNull();
  });

  it('cancelarEdicion → debería resetear formulario', () => {
    component.modoEdicion = true;
    component.tarifaEditando = { id: 1 };

    component.cancelarEdicion();

    expect(component.modoEdicion).toBeFalse();
    expect(component.tarifaEditando).toBeNull();
  });

  it('cargarTarifas → debería manejar errores', fakeAsync(() => {
    component.tienePermisoLeer = true;
    tarifaServiceSpy.getAllTarifas.and.returnValue(
      throwError(() => new Error('Error de red'))
    );

    component.cargarTarifas();
    tick();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Error al cargar las tarifas. Por favor, intente de nuevo.');
  }));
});