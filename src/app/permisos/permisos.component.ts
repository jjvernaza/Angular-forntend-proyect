import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PermisoService } from '../services/permiso.service';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  
  constructor(
    private fb: FormBuilder,
    private permisoService: PermisoService
  ) {
    this.permisoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }
  
  ngOnInit(): void {
    this.cargarPermisos();
  }
  
  get f() { return this.permisoForm.controls; }
  
  cargarPermisos(): void {
    this.isLoading = true;
    this.permisoService.getAllPermisos().subscribe({
      next: (data) => {
        this.permisos = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar permisos:', error);
        this.errorMessage = 'Error al cargar los permisos. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarPermiso(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.permisoForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      // Actualizar permiso existente
      this.permisoService.updatePermiso(this.permisoEditando.id, this.permisoForm.value).subscribe({
        next: () => {
          this.successMessage = 'Permiso actualizado correctamente';
          this.cargarPermisos();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al actualizar permiso:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar el permiso';
          this.isSubmitting = false;
        }
      });
    } else {
      // Crear nuevo permiso
      this.permisoService.createPermiso(this.permisoForm.value).subscribe({
        next: () => {
          this.successMessage = 'Permiso creado correctamente';
          this.cargarPermisos();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al crear permiso:', error);
          this.errorMessage = error?.error?.message || 'Error al crear el permiso';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarPermiso(permiso: any): void {
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
    this.permisoAEliminar = permiso;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarPermiso(): void {
    if (!this.permisoAEliminar) return;
    
    this.isDeletingPermiso = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.permisoService.deletePermiso(this.permisoAEliminar.id).subscribe({
      next: () => {
        this.cargarPermisos();
        this.showConfirmModal = false;
        this.permisoAEliminar = null;
        this.isDeletingPermiso = false;
        this.successMessage = 'Permiso eliminado correctamente';
      },
      error: (error) => {
        console.error('Error al eliminar permiso:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar el permiso';
        this.isDeletingPermiso = false;
        
        // Si el error es 409 (Conflict), significaría que el permiso está siendo usado
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
    this.permisoSeleccionado = permiso;
    this.showUsuariosModal = true;
    this.isLoadingUsuarios = true;
    this.usuariosConPermiso = [];
    this.revokeErrorMessage = '';
    
    this.permisoService.getUsuariosByPermiso(permiso.id).subscribe({
      next: (data) => {
        this.usuariosConPermiso = data;
        this.isLoadingUsuarios = false;
      },
      error: (error) => {
        console.error('Error al obtener usuarios con permiso:', error);
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
    this.isRevokingPermiso = true;
    this.revocacionEnProceso = asignacionId;
    this.revokeErrorMessage = '';
    
    this.permisoService.revokePermiso(asignacionId).subscribe({
      next: () => {
        // Filtrar la asignación revocada
        this.usuariosConPermiso = this.usuariosConPermiso.filter(u => u.id !== asignacionId);
        this.isRevokingPermiso = false;
        this.revocacionEnProceso = null;
      },
      error: (error) => {
        console.error('Error al revocar permiso:', error);
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