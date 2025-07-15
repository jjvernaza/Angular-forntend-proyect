import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../services/auth.service';
import { Component } from '@angular/core';

// Componente dummy para las rutas de testing
@Component({
  template: '<div>Dummy Component</div>'
})
class DummyComponent { }

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent, 
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: DummyComponent },
          { path: 'clientes', component: DummyComponent },
          { path: 'pagos', component: DummyComponent },
          { path: 'morosos', component: DummyComponent },
          { path: 'planes', component: DummyComponent },
          { path: 'tarifas', component: DummyComponent },
          { path: 'usuarios', component: DummyComponent },
          { path: 'reportes', component: DummyComponent },
          { path: 'login', component: DummyComponent },
          { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
        ])
      ],
      declarations: [DummyComponent],
      providers: [AuthService]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});