import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PermisoService } from '../services/permiso.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './permisos.component.html',
  styleUrls: ['./permisos.component.css']
})
export class PermisosComponent implements OnInit {
  permisoForm: FormGroup;
  permisos: any[] = [];
  modoEdicion = false;
  permisoEditando: any = null;
  permisoAEliminar: any = null;
  
  // Para modal de usuarios
  showUsuariosModal = false;
  permisoSeleccionado: any = null;
  usuariosConPermiso: any[] = [];
  isLoadingUsuarios = false;
  isRevokingPermiso = false;
  revocacionEnProceso: number | null = null;
  revokeErrorMessage = '';
  
  isLoading = false;
  isSubmitting = false;
  isDeletingPermiso = false;
  submitted = false;
  
  successMessage = '';
  errorMessage = '';
  showConfirmModal = false;
  hasError = false;

  // ✅ Variables de permisos
  tienePermisoLeer: boolean = false;
  tienePermisoCrear: boolean = false;
  tienePermisoActualizar: boolean = false;
  tienePermisoEliminar: boolean = false;
  tienePermisoRevocar: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private permisoService: PermisoService,
    private authService: AuthService
  ) {
    this.permisoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }
  
  ngOnInit(): void {
    // ✅ Verificar permisos
    this.verificarPermisos();

    // ✅ Solo cargar si tiene permiso de lectura
    if (this.tienePermisoLeer) {
      this.cargarPermisos();
    }
  }

  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('permisos.leer');
    this.tienePermisoCrear = this.authService.hasPermission('permisos.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('permisos.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('permisos.eliminar');
    this.tienePermisoRevocar = this.authService.hasPermission('permisos.revocar');
    
    console.log('🔐 Permisos en permisos:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Crear:', this.tienePermisoCrear);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
    console.log('   Revocar:', this.tienePermisoRevocar);
  }
  
  get f() { return this.permisoForm.controls; }
  
  cargarPermisos(): void {
    if (!this.tienePermisoLeer) {
      console.log('❌ Sin permisos para leer permisos');
      return;
    }

    this.isLoading = true;
    this.permisoService.getAllPermisos().subscribe({
      next: (data) => {
        this.permisos = data;
        this.isLoading = false;
        console.log('✅ Permisos cargados:', this.permisos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar permisos:', error);
        this.errorMessage = 'Error al cargar los permisos. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarPermiso(): void {
    // ✅ Verificar permisos
    if (this.modoEdicion && !this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar permisos.');
      return;
    }
    if (!this.modoEdicion && !this.tienePermisoCrear) {
      alert('No tienes permisos para crear permisos.');
      return;
    }

    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.permisoForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      console.log('📝 Actualizando permiso:', this.permisoEditando.id);
      this.permisoService.updatePermiso(this.permisoEditando.id, this.permisoForm.value).subscribe({
        next: () => {
          this.successMessage = 'Permiso actualizado correctamente';
          this.cargarPermisos();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al actualizar permiso:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar el permiso';
          this.isSubmitting = false;
        }
      });
    } else {
      console.log('➕ Creando permiso:', this.permisoForm.value);
      this.permisoService.createPermiso(this.permisoForm.value).subscribe({
        next: () => {
          this.successMessage = 'Permiso creado correctamente';
          this.cargarPermisos();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al crear permiso:', error);
          this.errorMessage = error?.error?.message || 'Error al crear el permiso';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarPermiso(permiso: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar permisos.');
      return;
    }

    this.modoEdicion = true;
    this.permisoEditando = permiso;
    this.permisoForm.patchValue({
      nombre: permiso.nombre,
      descripcion: permiso.descripcion
    });
    this.successMessage = '';
    this.errorMessage = '';
  }
  
  cancelarEdicion(): void {
    this.resetForm();
  }
  
  confirmarEliminar(permiso: any): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar permisos.');
      return;
    }

    this.permisoAEliminar = permiso;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarPermiso(): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar permisos.');
      return;
    }

    if (!this.permisoAEliminar) return;
    
    this.isDeletingPermiso = true;
    this.hasError = false;
    this.errorMessage = '';
    
    console.log('🗑️ Eliminando permiso:', this.permisoAEliminar.id);

    this.permisoService.deletePermiso(this.permisoAEliminar.id).subscribe({
      next: () => {
        this.cargarPermisos();
        this.showConfirmModal = false;
        this.permisoAEliminar = null;
        this.isDeletingPermiso = false;
        this.successMessage = 'Permiso eliminado correctamente';
      },
      error: (error) => {
        console.error('❌ Error al eliminar permiso:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar el permiso';
        this.isDeletingPermiso = false;
        
        if (error.status === 409) {
          this.errorMessage = 'No se puede eliminar el permiso porque está asignado a uno o más usuarios.';
        }
      }
    });
  }
  
  cancelarEliminacion(): void {
    this.showConfirmModal = false;
    this.permisoAEliminar = null;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  verUsuariosAsignados(permiso: any): void {
    if (!this.tienePermisoLeer) {
      alert('No tienes permisos para ver usuarios con permisos.');
      return;
    }

    this.permisoSeleccionado = permiso;
    this.showUsuariosModal = true;
    this.isLoadingUsuarios = true;
    this.usuariosConPermiso = [];
    this.revokeErrorMessage = '';
    
    console.log('👥 Cargando usuarios con permiso:', permiso.id);

    this.permisoService.getUsuariosByPermiso(permiso.id).subscribe({
      next: (data) => {
        this.usuariosConPermiso = data;
        this.isLoadingUsuarios = false;
        console.log('✅ Usuarios con permiso cargados:', this.usuariosConPermiso.length);
      },
      error: (error) => {
        console.error('❌ Error al obtener usuarios con permiso:', error);
        this.isLoadingUsuarios = false;
        this.revokeErrorMessage = 'Error al cargar usuarios con este permiso';
      }
    });
  }
  
  cerrarModalUsuarios(): void {
    this.showUsuariosModal = false;
    this.permisoSeleccionado = null;
    this.usuariosConPermiso = [];
    this.revokeErrorMessage = '';
  }
  
  revocarPermiso(asignacionId: number): void {
    if (!this.tienePermisoRevocar) {
      alert('No tienes permisos para revocar permisos.');
      return;
    }

    this.isRevokingPermiso = true;
    this.revocacionEnProceso = asignacionId;
    this.revokeErrorMessage = '';
    
    console.log('🚫 Revocando permiso:', asignacionId);

    this.permisoService.revokePermiso(asignacionId).subscribe({
      next: () => {
        this.usuariosConPermiso = this.usuariosConPermiso.filter(u => u.id !== asignacionId);
        this.isRevokingPermiso = false;
        this.revocacionEnProceso = null;
        console.log('✅ Permiso revocado');
      },
      error: (error) => {
        console.error('❌ Error al revocar permiso:', error);
        this.revokeErrorMessage = error?.error?.message || 'Error al revocar el permiso';
        this.isRevokingPermiso = false;
        this.revocacionEnProceso = null;
      }
    });
  }
  
  resetForm(): void {
    this.submitted = false;
    this.modoEdicion = false;
    this.permisoEditando = null;
    this.permisoForm.reset();
    this.isSubmitting = false;
  }
}