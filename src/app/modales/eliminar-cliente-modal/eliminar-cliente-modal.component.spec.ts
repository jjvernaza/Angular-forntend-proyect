import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EliminarClienteModalComponent } from './eliminar-cliente-modal.component';

describe('EliminarClienteModalComponent', () => {
  let component: EliminarClienteModalComponent;
  let fixture: ComponentFixture<EliminarClienteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EliminarClienteModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EliminarClienteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
