// src/app/planes/planes.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { PlanesComponent } from './planes.component';
import { PlanService } from '../services/plan.service';
import { AuthService } from '../services/auth.service';

describe('PlanesComponent', () => {
  let component: PlanesComponent;
  let fixture: ComponentFixture<PlanesComponent>;
  let planServiceSpy: jasmine.SpyObj<PlanService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockPlanes = [
    { id: 1, nombre: 'Plan Básico', velocidad: '10 Mbps' },
    { id: 2, nombre: 'Plan Premium', velocidad: '50 Mbps' }
  ];

  beforeEach(async () => {
    planServiceSpy = jasmine.createSpyObj('PlanService', [
      'getAllPlanes',
      'createPlan',
      'updatePlan',
      'deletePlan'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);

    await TestBed.configureTestingModule({
      imports: [PlanesComponent, ReactiveFormsModule],
      providers: [
        { provide: PlanService, useValue: planServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit → debería cargar planes si tiene permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(true);
    planServiceSpy.getAllPlanes.and.returnValue(of(mockPlanes));

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeTrue();
    expect(planServiceSpy.getAllPlanes).toHaveBeenCalled();
    expect(component.planes.length).toBe(2);
  });

  it('ngOnInit → NO debería cargar planes sin permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(false);

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeFalse();
    expect(planServiceSpy.getAllPlanes).not.toHaveBeenCalled();
  });

  it('guardarPlan → debería crear plan nuevo', fakeAsync(() => {
    component.tienePermisoCrear = true;
    component.planForm.setValue({ nombre: 'Plan Test', velocidad: '100 Mbps' });
    planServiceSpy.createPlan.and.returnValue(of({}));
    planServiceSpy.getAllPlanes.and.returnValue(of(mockPlanes));

    component.guardarPlan();
    tick();

    expect(planServiceSpy.createPlan).toHaveBeenCalledWith({
      nombre: 'Plan Test',
      velocidad: '100 Mbps'
    });
    expect(component.successMessage).toBe('Plan creado correctamente');
  }));

  it('guardarPlan → debería actualizar plan en modo edición', fakeAsync(() => {
    component.tienePermisoActualizar = true;
    component.modoEdicion = true;
    component.planEditando = { id: 1 };
    component.planForm.setValue({ nombre: 'Plan Actualizado', velocidad: '200 Mbps' });
    planServiceSpy.updatePlan.and.returnValue(of({}));
    planServiceSpy.getAllPlanes.and.returnValue(of(mockPlanes));

    component.guardarPlan();
    tick();

    expect(planServiceSpy.updatePlan).toHaveBeenCalledWith(1, {
      nombre: 'Plan Actualizado',
      velocidad: '200 Mbps'
    });
    expect(component.successMessage).toBe('Plan actualizado correctamente');
  }));

  it('guardarPlan → NO debería crear si no tiene permisos', () => {
    component.tienePermisoCrear = false;
    spyOn(window, 'alert');

    component.guardarPlan();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear planes.');
    expect(planServiceSpy.createPlan).not.toHaveBeenCalled();
  });

  it('guardarPlan → NO debería enviar si formulario es inválido', () => {
    component.tienePermisoCrear = true;
    component.planForm.setValue({ nombre: '', velocidad: '' });

    component.guardarPlan();

    expect(component.submitted).toBeTrue();
    expect(planServiceSpy.createPlan).not.toHaveBeenCalled();
  });

  it('editarPlan → debería cargar datos en formulario', () => {
    component.tienePermisoActualizar = true;
    const plan = { id: 1, nombre: 'Plan Test', velocidad: '50 Mbps' };

    component.editarPlan(plan);

    expect(component.modoEdicion).toBeTrue();
    expect(component.planEditando).toEqual(plan);
    expect(component.planForm.value.nombre).toBe('Plan Test');
    expect(component.planForm.value.velocidad).toBe('50 Mbps');
  });

  it('editarPlan → NO debería editar sin permisos', () => {
    component.tienePermisoActualizar = false;
    spyOn(window, 'alert');

    component.editarPlan({ id: 1 });

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para editar planes.');
    expect(component.modoEdicion).toBeFalse();
  });

  it('eliminarPlan → debería eliminar plan', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.planAEliminar = { id: 1 };
    planServiceSpy.deletePlan.and.returnValue(of({}));
    planServiceSpy.getAllPlanes.and.returnValue(of(mockPlanes));

    component.eliminarPlan();
    tick();

    expect(planServiceSpy.deletePlan).toHaveBeenCalledWith(1);
    expect(component.showConfirmModal).toBeFalse();
    expect(component.successMessage).toBe('Plan eliminado correctamente');
  }));

  it('eliminarPlan → debería manejar error de conflicto', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.planAEliminar = { id: 1 };
    planServiceSpy.deletePlan.and.returnValue(
      throwError(() => ({ status: 409 }))
    );

    component.eliminarPlan();
    tick();

    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toContain('está siendo utilizado');
  }));

  it('confirmarEliminar → debería mostrar modal de confirmación', () => {
    component.tienePermisoEliminar = true;
    const plan = { id: 1, nombre: 'Plan Test' };

    component.confirmarEliminar(plan);

    expect(component.showConfirmModal).toBeTrue();
    expect(component.planAEliminar).toEqual(plan);
  });

  it('cancelarEliminacion → debería cerrar modal', () => {
    component.showConfirmModal = true;
    component.planAEliminar = { id: 1 };

    component.cancelarEliminacion();

    expect(component.showConfirmModal).toBeFalse();
    expect(component.planAEliminar).toBeNull();
  });

  it('cancelarEdicion → debería resetear formulario', () => {
    component.modoEdicion = true;
    component.planEditando = { id: 1 };

    component.cancelarEdicion();

    expect(component.modoEdicion).toBeFalse();
    expect(component.planEditando).toBeNull();
  });

  it('cargarPlanes → debería manejar errores', fakeAsync(() => {
    component.tienePermisoLeer = true;
    planServiceSpy.getAllPlanes.and.returnValue(
      throwError(() => new Error('Error de red'))
    );

    component.cargarPlanes();
    tick();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Error al cargar los planes. Por favor, intente de nuevo.');
  }));
});