import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { PermisoService } from '../services/permiso.service';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
  
  // ✅ Variables de permisos
  tienePermiso: boolean = false;
  tienePermisoAsignarPermisos: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private permisoService: PermisoService,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
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
    // ✅ Verificar permisos
    this.verificarPermisos();
    
    // ✅ Solo cargar datos si tiene permiso
    if (!this.tienePermiso) {
      console.log('❌ Usuario sin permisos para crear usuarios');
      return;
    }
    
    // Cargar permisos (solo si tiene permiso para asignarlos)
    if (this.tienePermisoAsignarPermisos) {
      this.permisoService.getAllPermisos().subscribe(
        data => {
          this.permisos = data;
          console.log('✅ Permisos cargados:', this.permisos.length);
        },
        error => {
          console.error('❌ Error al cargar permisos:', error);
          this.errorMessage = 'Error al cargar permisos. Por favor, intente de nuevo.';
        }
      );
    }
    
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
        console.error('❌ Error al cargar estados:', error);
        this.errorMessage = 'Error al cargar estados. Por favor, intente de nuevo.';
      }
    );
  }
  
  private verificarPermisos(): void {
    this.tienePermiso = this.authService.hasPermission('usuarios.crear');
    this.tienePermisoAsignarPermisos = this.authService.hasPermission('usuarios.asignar_permisos');
    
    console.log('🔐 Permisos en crear-usuario:');
    console.log('   Crear usuario:', this.tienePermiso);
    console.log('   Asignar permisos:', this.tienePermisoAsignarPermisos);
  }
  
  crearUsuario() {
    // ✅ Verificar permiso antes de crear
    if (!this.tienePermiso) {
      alert('No tienes permisos para crear usuarios.');
      return;
    }

    if (this.usuarioForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';
      
      const userData = this.usuarioForm.value;
      
      // Convertir estado_id a número
      userData.estado_id = parseInt(userData.estado_id, 10);
      
      console.log('📝 Creando usuario:', userData);
      console.log('🔐 Permisos seleccionados:', this.selectedPermisos);
      
      // Crear usuario
      this.userService.createUser(userData).subscribe(
        response => {
          console.log('✅ Usuario creado:', response);
          const userId = response.usuario.id || response.usuario.ID;
          
          // Si hay permisos seleccionados Y tiene permiso para asignarlos
          if (this.selectedPermisos.length > 0 && this.tienePermisoAsignarPermisos) {
            this.assignPermisosToUser(userId);
          } else {
            this.isSubmitting = false;
            this.successMessage = 'Usuario creado exitosamente.';
            this.resetForm();
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          }
        },
        error => {
          this.isSubmitting = false;
          console.error('❌ Error al crear usuario:', error);
          
          if (error.status === 409) {
            this.errorMessage = 'Ya existe un usuario con ese nombre de usuario o cédula.';
          } else {
            this.errorMessage = error.error?.message || 'Error al crear usuario. Por favor, intente de nuevo.';
          }
        }
      );
    } else {
      Object.keys(this.usuarioForm.controls).forEach(key => {
        this.usuarioForm.get(key)?.markAsTouched();
      });
      this.errorMessage = 'Por favor, complete todos los campos requeridos.';
    }
  }
  
  togglePermiso(permisoId: number) {
    if (!this.tienePermisoAsignarPermisos) {
      alert('No tienes permisos para asignar permisos a otros usuarios.');
      return;
    }

    const index = this.selectedPermisos.indexOf(permisoId);
    if (index === -1) {
      this.selectedPermisos.push(permisoId);
      console.log('✅ Permiso agregado:', permisoId, 'Total:', this.selectedPermisos.length);
    } else {
      this.selectedPermisos.splice(index, 1);
      console.log('❌ Permiso removido:', permisoId, 'Total:', this.selectedPermisos.length);
    }
  }
  
  isPermisoSelected(permisoId: number): boolean {
    return this.selectedPermisos.includes(permisoId);
  }
  
  assignPermisosToUser(userId: number) {
    let assignedCount = 0;
    let errorOccurred = false;
    const totalPermisos = this.selectedPermisos.length;
    
    console.log(`🔄 Asignando ${totalPermisos} permisos al usuario ${userId}`);
    
    this.selectedPermisos.forEach((permisoId, index) => {
      console.log(`📤 Asignando permiso ${index + 1}/${totalPermisos}: ${permisoId}`);
      
      this.permisoService.assignPermiso(userId, permisoId).subscribe(
        (response) => {
          assignedCount++;
          console.log(`✅ Permiso ${permisoId} asignado (${assignedCount}/${totalPermisos})`);
          
          if (assignedCount === totalPermisos && !errorOccurred) {
            this.isSubmitting = false;
            this.successMessage = 'Usuario creado exitosamente con todos los permisos asignados.';
            this.resetForm();
            setTimeout(() => {
              this.successMessage = '';
            }, 5000);
          }
        },
        error => {
          errorOccurred = true;
          console.error(`❌ Error al asignar permiso ${permisoId}:`, error);
          this.isSubmitting = false;
          this.errorMessage = `Usuario creado, pero hubo un error al asignar el permiso: ${error.error?.message || 'Error desconocido'}`;
        }
      );
    });
  }
  
  resetForm() {
    this.usuarioForm.reset();
    this.selectedPermisos = [];
    
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