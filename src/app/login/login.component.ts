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

  // ✅ Redirigir si ya tiene token
  ngOnInit() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
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
          permisos: response.user.permisos
        });
        
        // El token y el usuario ya se guardan en el AuthService por el tap() en el observable
        this.errorMessage = '';
  
        // Mensaje de bienvenida personalizado
        const welcomeMessage = response.user.nombre 
          ? `Bienvenido ${response.user.nombre} a la dashboard de VozipCompany`
          : 'Bienvenido a la dashboard de VozipCompany';
          
        alert(welcomeMessage);
  
        // 🔁 Dale un pequeño delay para que Angular tenga tiempo de refrescar el guard
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 100);
      },
      error: (err) => {
        console.error('❌ Error de login:', err);
        if (err.status === 404) {
          this.errorMessage = 'Usuario no encontrado.';
        } else if (err.status === 401) {
          this.errorMessage = 'Contraseña incorrecta.';
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