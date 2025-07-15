import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { PermisoService } from '../services/permiso.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-usuario.component.html',
  styleUrls: ['./crear-usuario.component.css']
})
export class CrearUsuarioComponent implements OnInit {
  usuarioForm: FormGroup;
  permisos: any[] = [];
  estados: any[] = [];
  selectedPermisos: number[] = [];
  isSubmitting: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private permisoService: PermisoService,
    private apiService: ApiService
  ) {
    this.usuarioForm = this.fb.group({
      Nombre: ['', Validators.required],
      Apellidos: ['', Validators.required],
      Cedula: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      Telefono: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      Funcion: ['', Validators.required],
      User: ['', Validators.required],
      Password: ['', [Validators.required, Validators.minLength(6)]],
      estado_id: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    // Cargar permisos
    this.permisoService.getAllPermisos().subscribe(
      data => {
        this.permisos = data;
      },
      error => {
        console.error('Error al cargar permisos:', error);
        this.errorMessage = 'Error al cargar permisos. Por favor, intente de nuevo.';
      }
    );
    
    // Cargar estados
    this.apiService.getEstados().subscribe(
      data => {
        this.estados = data;
        
        // Buscar estado "Activo" y establecerlo como valor predeterminado
        const estadoActivo = this.estados.find(estado => estado.Estado === 'Activo');
        if (estadoActivo) {
          this.usuarioForm.patchValue({
            estado_id: estadoActivo.ID
          });
        }
      },
      error => {
        console.error('Error al cargar estados:', error);
        this.errorMessage = 'Error al cargar estados. Por favor, intente de nuevo.';
      }
    );
  }
  
  crearUsuario() {
    if (this.usuarioForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const userData = this.usuarioForm.value;
      
      // Convertir estado_id a número
      userData.estado_id = parseInt(userData.estado_id, 10);
      
      // Crear usuario
      this.userService.createUser(userData).subscribe(
        response => {
          const userId = response.usuario.id;
          
          // Si hay permisos seleccionados, asignarlos al usuario
          if (this.selectedPermisos.length > 0) {
            this.assignPermisosToUser(userId);
          } else {
            this.isSubmitting = false;
            this.successMessage = 'Usuario creado exitosamente.';
            this.resetForm();
          }
        },
        error => {
          this.isSubmitting = false;
          console.error('Error al crear usuario:', error);
          
          if (error.status === 409) {
            this.errorMessage = 'Ya existe un usuario con ese nombre de usuario o cédula.';
          } else {
            this.errorMessage = error.error?.message || 'Error al crear usuario. Por favor, intente de nuevo.';
          }
        }
      );
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.usuarioForm.controls).forEach(key => {
        this.usuarioForm.get(key)?.markAsTouched();
      });
    }
  }
  
  togglePermiso(permisoId: number) {
    const index = this.selectedPermisos.indexOf(permisoId);
    if (index === -1) {
      // Añadir permiso
      this.selectedPermisos.push(permisoId);
    } else {
      // Remover permiso
      this.selectedPermisos.splice(index, 1);
    }
  }
  
  assignPermisosToUser(userId: number) {
    let assignedCount = 0;
    let errorOccurred = false;
    
    for (const permisoId of this.selectedPermisos) {
      this.permisoService.assignPermiso(userId, permisoId).subscribe(
        () => {
          assignedCount++;
          
          // Verificar si todos los permisos han sido asignados
          if (assignedCount === this.selectedPermisos.length && !errorOccurred) {
            this.isSubmitting = false;
            this.successMessage = 'Usuario creado exitosamente con todos los permisos asignados.';
            this.resetForm();
          }
        },
        error => {
          errorOccurred = true;
          console.error(`Error al asignar permiso ${permisoId} al usuario ${userId}:`, error);
          this.isSubmitting = false;
          this.errorMessage = 'Usuario creado, pero hubo un error al asignar algunos permisos.';
        }
      );
    }
  }
  
  resetForm() {
    this.usuarioForm.reset();
    this.selectedPermisos = [];
    
    // Restablecer el estado activo
    const estadoActivo = this.estados.find(estado => estado.Estado === 'Activo');
    if (estadoActivo) {
      this.usuarioForm.patchValue({
        estado_id: estadoActivo.ID
      });
    }
  }
  
  getFormErrors(controlName: string): boolean {
    const control = this.usuarioForm.get(controlName);
    return control !== null && control.invalid && (control.dirty || control.touched);
  }
}