import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PermisosComponent } from './permisos.component';
import { PermisoService } from '../services/permiso.service';
import { UserService } from '../services/user.service';

describe('PermisosComponent', () => {
  let component: PermisosComponent;
  let fixture: ComponentFixture<PermisosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermisosComponent, HttpClientTestingModule], // ← IMPORTS
      providers: [PermisoService, UserService]
    }).compileComponents();

    fixture = TestBed.createComponent(PermisosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});