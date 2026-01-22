// src/app/sectores/sectores.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SectoresComponent } from './sectores.component';
import { SectorService } from '../services/sector.service';
import { AuthService } from '../services/auth.service';

describe('SectoresComponent', () => {
  let component: SectoresComponent;
  let fixture: ComponentFixture<SectoresComponent>;
  let sectorServiceSpy: jasmine.SpyObj<SectorService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockSectores = [
    { id: 1, nombre: 'Sector Norte', descripcion: 'Zona norte de la ciudad' },
    { id: 2, nombre: 'Sector Sur', descripcion: 'Zona sur de la ciudad' }
  ];

  beforeEach(async () => {
    sectorServiceSpy = jasmine.createSpyObj('SectorService', [
      'getAllSectores',
      'createSector',
      'updateSector',
      'deleteSector'
    ]);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);

    await TestBed.configureTestingModule({
      imports: [SectoresComponent, ReactiveFormsModule],
      providers: [
        { provide: SectorService, useValue: sectorServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SectoresComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit → debería cargar sectores si tiene permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(true);
    sectorServiceSpy.getAllSectores.and.returnValue(of(mockSectores));

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeTrue();
    expect(sectorServiceSpy.getAllSectores).toHaveBeenCalled();
    expect(component.sectores.length).toBe(2);
  });

  it('ngOnInit → NO debería cargar sectores sin permiso de lectura', () => {
    authServiceSpy.hasPermission.and.returnValue(false);

    fixture.detectChanges();

    expect(component.tienePermisoLeer).toBeFalse();
    expect(sectorServiceSpy.getAllSectores).not.toHaveBeenCalled();
  });

  it('guardarSector → debería crear sector nuevo', fakeAsync(() => {
    component.tienePermisoCrear = true;
    component.sectorForm.setValue({ nombre: 'Sector Este', descripcion: 'Test' });
    sectorServiceSpy.createSector.and.returnValue(of({}));
    sectorServiceSpy.getAllSectores.and.returnValue(of(mockSectores));

    component.guardarSector();
    tick();

    expect(sectorServiceSpy.createSector).toHaveBeenCalledWith({
      nombre: 'Sector Este',
      descripcion: 'Test'
    });
    expect(component.successMessage).toBe('Sector creado correctamente');
  }));

  it('guardarSector → debería actualizar sector en modo edición', fakeAsync(() => {
    component.tienePermisoActualizar = true;
    component.modoEdicion = true;
    component.sectorEditando = { id: 1 };
    component.sectorForm.setValue({ nombre: 'Sector Actualizado', descripcion: 'Updated' });
    sectorServiceSpy.updateSector.and.returnValue(of({}));
    sectorServiceSpy.getAllSectores.and.returnValue(of(mockSectores));

    component.guardarSector();
    tick();

    expect(sectorServiceSpy.updateSector).toHaveBeenCalledWith(1, {
      nombre: 'Sector Actualizado',
      descripcion: 'Updated'
    });
    expect(component.successMessage).toBe('Sector actualizado correctamente');
  }));

  it('guardarSector → NO debería crear si no tiene permisos', () => {
    component.tienePermisoCrear = false;
    spyOn(window, 'alert');

    component.guardarSector();

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para crear sectores.');
    expect(sectorServiceSpy.createSector).not.toHaveBeenCalled();
  });

  it('guardarSector → NO debería enviar si formulario es inválido', () => {
    component.tienePermisoCrear = true;
    component.sectorForm.setValue({ nombre: '', descripcion: '' });

    component.guardarSector();

    expect(component.submitted).toBeTrue();
    expect(sectorServiceSpy.createSector).not.toHaveBeenCalled();
  });

  it('editarSector → debería cargar datos en formulario', () => {
    component.tienePermisoActualizar = true;
    const sector = { id: 1, nombre: 'Sector Test', descripcion: 'Test' };

    component.editarSector(sector);

    expect(component.modoEdicion).toBeTrue();
    expect(component.sectorEditando).toEqual(sector);
    expect(component.sectorForm.value.nombre).toBe('Sector Test');
  });

  it('editarSector → NO debería editar sin permisos', () => {
    component.tienePermisoActualizar = false;
    spyOn(window, 'alert');

    component.editarSector({ id: 1 });

    expect(window.alert).toHaveBeenCalledWith('No tienes permisos para editar sectores.');
    expect(component.modoEdicion).toBeFalse();
  });

  it('eliminarSector → debería eliminar sector', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.sectorAEliminar = { id: 1 };
    sectorServiceSpy.deleteSector.and.returnValue(of({}));
    sectorServiceSpy.getAllSectores.and.returnValue(of(mockSectores));

    component.eliminarSector();
    tick();

    expect(sectorServiceSpy.deleteSector).toHaveBeenCalledWith(1);
    expect(component.showConfirmModal).toBeFalse();
    expect(component.successMessage).toBe('Sector eliminado correctamente');
  }));

  it('eliminarSector → debería manejar error de conflicto', fakeAsync(() => {
    component.tienePermisoEliminar = true;
    component.sectorAEliminar = { id: 1 };
    sectorServiceSpy.deleteSector.and.returnValue(
      throwError(() => ({ status: 409 }))
    );

    component.eliminarSector();
    tick();

    expect(component.hasError).toBeTrue();
    expect(component.errorMessage).toContain('está siendo utilizado');
  }));

  it('confirmarEliminar → debería mostrar modal de confirmación', () => {
    component.tienePermisoEliminar = true;
    const sector = { id: 1, nombre: 'Sector Test' };

    component.confirmarEliminar(sector);

    expect(component.showConfirmModal).toBeTrue();
    expect(component.sectorAEliminar).toEqual(sector);
  });

  it('cancelarEliminacion → debería cerrar modal', () => {
    component.showConfirmModal = true;
    component.sectorAEliminar = { id: 1 };

    component.cancelarEliminacion();

    expect(component.showConfirmModal).toBeFalse();
    expect(component.sectorAEliminar).toBeNull();
  });

  it('cancelarEdicion → debería resetear formulario', () => {
    component.modoEdicion = true;
    component.sectorEditando = { id: 1 };

    component.cancelarEdicion();

    expect(component.modoEdicion).toBeFalse();
    expect(component.sectorEditando).toBeNull();
  });

  it('cargarSectores → debería manejar errores', fakeAsync(() => {
    component.tienePermisoLeer = true;
    sectorServiceSpy.getAllSectores.and.returnValue(
      throwError(() => new Error('Error de red'))
    );

    component.cargarSectores();
    tick();

    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Error al cargar los sectores. Por favor, intente de nuevo.');
  }));
});