// src/app/eliminar-cliente-modal/eliminar-cliente-modal.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EliminarClienteModalComponent } from './eliminar-cliente-modal.component';

describe('EliminarClienteModalComponent', () => {
  let component: EliminarClienteModalComponent;
  let fixture: ComponentFixture<EliminarClienteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarClienteModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(EliminarClienteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar con valores por defecto', () => {
    expect(component.mostrarModal).toBeFalse();
    expect(component.nombreCliente).toBe('');
  });

  it('cerrar() → debería emitir evento cerrarModal', () => {
    spyOn(component.cerrarModal, 'emit');
    
    component.cerrar();
    
    expect(component.cerrarModal.emit).toHaveBeenCalled();
  });

  it('eliminar() → debería emitir evento confirmarEliminacion con clienteId', () => {
    spyOn(component.confirmarEliminacion, 'emit');
    component.clienteId = 123;
    
    component.eliminar();
    
    expect(component.confirmarEliminacion.emit).toHaveBeenCalledWith(123);
  });

  it('debería cerrar modal al presionar Escape', () => {
    spyOn(component.cerrarModal, 'emit');
    component.mostrarModal = true;
    
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    
    expect(component.cerrarModal.emit).toHaveBeenCalled();
  });

  it('NO debería cerrar modal con Escape si mostrarModal es false', () => {
    spyOn(component.cerrarModal, 'emit');
    component.mostrarModal = false;
    
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    
    expect(component.cerrarModal.emit).not.toHaveBeenCalled();
  });

  it('debería limpiar event listeners en ngOnDestroy', () => {
    spyOn(document, 'removeEventListener');
    
    component.ngOnDestroy();
    
    expect(document.removeEventListener).toHaveBeenCalled();
  });
});