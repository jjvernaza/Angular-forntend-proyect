// src/app/login/login.component.spec.ts
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'getFirstAvailableRoute',
      'login'
    ]);

    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        LoginComponent  // componente standalone
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar el formulario inválido y sin errores mostrados', () => {
    expect(component.loginForm.valid).toBeFalse();
    expect(component.loginForm.get('username')?.touched).toBeFalse();
    expect(component.loginForm.get('password')?.touched).toBeFalse();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('ngOnInit → redirige si ya está autenticado', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    authServiceSpy.getFirstAvailableRoute.and.returnValue('/dashboard');

    component.ngOnInit();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('onSubmit → marca controles como touched y NO hace login si formulario inválido', fakeAsync(() => {
    // Aseguramos que esté inválido
    expect(component.loginForm.valid).toBeFalse();

    // Ejecutamos el submit
    component.onSubmit();

    // ¡Esto es lo que faltaba! Forzamos la detección de cambios
    fixture.detectChanges();

    // Opcional: tick() por si hay algún efecto asíncrono residual
    tick();

    // Ahora sí deberían estar touched
    expect(component.loginForm.get('username')?.touched).toBeTrue();
    expect(component.loginForm.get('password')?.touched).toBeTrue();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('onSubmit → llama al servicio y redirige cuando login es exitoso', fakeAsync(() => {
    component.loginForm.setValue({
      username: 'juan',
      password: '123456'
    });

    const mockResponse = {
      user: {
        nombre: 'Juan José',
        funcion: 'admin',
        permisos: ['read', 'write']
      }
    };

    (authServiceSpy.login as jasmine.Spy).and.returnValue(of(mockResponse));
    authServiceSpy.getFirstAvailableRoute.and.returnValue('/home');

    component.onSubmit();
    tick();

    expect(authServiceSpy.login).toHaveBeenCalledWith('juan', '123456');
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  }));

  it('onSubmit → muestra mensaje de error cuando login falla (401)', fakeAsync(() => {
    component.loginForm.setValue({
      username: 'juan',
      password: 'mal'
    });

    (authServiceSpy.login as jasmine.Spy).and.returnValue(throwError(() => ({ status: 401 })));

    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Contraseña incorrecta.');
    expect(component.isLoading).toBeFalse();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  }));

  it('onSubmit → muestra mensaje genérico en error desconocido', fakeAsync(() => {
    component.loginForm.setValue({
      username: 'juan',
      password: '123'
    });

    (authServiceSpy.login as jasmine.Spy).and.returnValue(
      throwError(() => ({ status: 500, error: { message: 'Server down' } }))
    );

    component.onSubmit();
    tick();

    expect(component.errorMessage).toBe('Server down');
    expect(component.isLoading).toBeFalse();
  }));
});