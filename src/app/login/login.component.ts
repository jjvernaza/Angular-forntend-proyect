// src/app/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    // ✅ Si ya está autenticado, redirigir a la primera ruta disponible
    if (this.authService.isAuthenticated()) {
      const firstRoute = this.authService.getFirstAvailableRoute();
      this.router.navigate([firstRoute]);
    }
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    const { username, password } = this.loginForm.value;
    console.log('📩 Formulario enviado:', { username });
  
    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('✅ Login exitoso:', {
          username: response.user.nombre,
          role: response.user.funcion,
          permisos: response.user.permisos?.length || 0
        });
        
        this.errorMessage = '';
        
        // ✅ Obtener la primera ruta disponible según permisos
        const firstRoute = this.authService.getFirstAvailableRoute();
        console.log(`🎯 Redirigiendo a: ${firstRoute}`);
        
        const welcomeMessage = response.user.nombre 
          ? `Bienvenido ${response.user.nombre} a VozipCompany`
          : 'Bienvenido a VozipCompany';
          
        alert(welcomeMessage);
        
        this.router.navigate([firstRoute]);
      },
      error: (err) => {
        console.error('❌ Error de login:', err);
        if (err.status === 404) {
          this.errorMessage = 'Usuario no encontrado.';
        } else if (err.status === 401) {
          this.errorMessage = 'Contraseña incorrecta.';
        } else if (err.status === 403) {
          this.errorMessage = 'Usuario inactivo o suspendido.';
        } else {
          this.errorMessage = err?.error?.message || 'Error al iniciar sesión.';
        }
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}