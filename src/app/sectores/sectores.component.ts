import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SectorService } from '../services/sector.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sectores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './sectores.component.html',
  styleUrls: ['./sectores.component.css']
})
export class SectoresComponent implements OnInit {
  sectorForm: FormGroup;
  sectores: any[] = [];
  modoEdicion = false;
  sectorEditando: any = null;
  sectorAEliminar: any = null;
  
  isLoading = false;
  isSubmitting = false;
  isDeletingSector = false;
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
  
  constructor(
    private fb: FormBuilder,
    private sectorService: SectorService,
    private authService: AuthService
  ) {
    this.sectorForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }
  
  ngOnInit(): void {
    // ✅ Verificar permisos
    this.verificarPermisos();

    // ✅ Solo cargar si tiene permiso de lectura
    if (this.tienePermisoLeer) {
      this.cargarSectores();
    }
  }

  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('sectores.leer');
    this.tienePermisoCrear = this.authService.hasPermission('sectores.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('sectores.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('sectores.eliminar');
    
    console.log('🔐 Permisos en sectores:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Crear:', this.tienePermisoCrear);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }
  
  get f() { return this.sectorForm.controls; }
  
  cargarSectores(): void {
    if (!this.tienePermisoLeer) {
      console.log('❌ Sin permisos para leer sectores');
      return;
    }

    this.isLoading = true;
    this.sectorService.getAllSectores().subscribe({
      next: (data) => {
        this.sectores = data;
        this.isLoading = false;
        console.log('✅ Sectores cargados:', this.sectores.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar sectores:', error);
        this.errorMessage = 'Error al cargar los sectores. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarSector(): void {
    // ✅ Verificar permisos
    if (this.modoEdicion && !this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar sectores.');
      return;
    }
    if (!this.modoEdicion && !this.tienePermisoCrear) {
      alert('No tienes permisos para crear sectores.');
      return;
    }

    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.sectorForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      console.log('📝 Actualizando sector:', this.sectorEditando.id);
      this.sectorService.updateSector(this.sectorEditando.id, this.sectorForm.value).subscribe({
        next: () => {
          this.successMessage = 'Sector actualizado correctamente';
          this.cargarSectores();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al actualizar sector:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar el sector';
          this.isSubmitting = false;
        }
      });
    } else {
      console.log('➕ Creando sector:', this.sectorForm.value);
      this.sectorService.createSector(this.sectorForm.value).subscribe({
        next: () => {
          this.successMessage = 'Sector creado correctamente';
          this.cargarSectores();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al crear sector:', error);
          this.errorMessage = error?.error?.message || 'Error al crear el sector';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarSector(sector: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar sectores.');
      return;
    }

    this.modoEdicion = true;
    this.sectorEditando = sector;
    this.sectorForm.patchValue({
      nombre: sector.nombre,
      descripcion: sector.descripcion
    });
    this.successMessage = '';
    this.errorMessage = '';
  }
  
  cancelarEdicion(): void {
    this.resetForm();
  }
  
  confirmarEliminar(sector: any): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar sectores.');
      return;
    }

    this.sectorAEliminar = sector;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarSector(): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar sectores.');
      return;
    }

    if (!this.sectorAEliminar) return;
    
    this.isDeletingSector = true;
    this.hasError = false;
    this.errorMessage = '';
    
    console.log('🗑️ Eliminando sector:', this.sectorAEliminar.id);

    this.sectorService.deleteSector(this.sectorAEliminar.id).subscribe({
      next: () => {
        this.cargarSectores();
        this.showConfirmModal = false;
        this.sectorAEliminar = null;
        this.isDeletingSector = false;
        this.successMessage = 'Sector eliminado correctamente';
      },
      error: (error) => {
        console.error('❌ Error al eliminar sector:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar el sector';
        this.isDeletingSector = false;
        
        if (error.status === 409) {
          this.errorMessage = 'No se puede eliminar el sector porque está siendo utilizado por uno o más clientes.';
        }
      }
    });
  }
  
  cancelarEliminacion(): void {
    this.showConfirmModal = false;
    this.sectorAEliminar = null;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  resetForm(): void {
    this.submitted = false;
    this.modoEdicion = false;
    this.sectorEditando = null;
    this.sectorForm.reset();
    this.isSubmitting = false;
  }
}