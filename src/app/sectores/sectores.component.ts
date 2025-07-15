import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SectorService } from '../services/sector.service';

@Component({
  selector: 'app-sectores',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  
  constructor(
    private fb: FormBuilder,
    private sectorService: SectorService
  ) {
    this.sectorForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['']
    });
  }
  
  ngOnInit(): void {
    this.cargarSectores();
  }
  
  get f() { return this.sectorForm.controls; }
  
  cargarSectores(): void {
    this.isLoading = true;
    this.sectorService.getAllSectores().subscribe({
      next: (data) => {
        this.sectores = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar sectores:', error);
        this.errorMessage = 'Error al cargar los sectores. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarSector(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.sectorForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      // Actualizar sector existente
      this.sectorService.updateSector(this.sectorEditando.id, this.sectorForm.value).subscribe({
        next: () => {
          this.successMessage = 'Sector actualizado correctamente';
          this.cargarSectores();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al actualizar sector:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar el sector';
          this.isSubmitting = false;
        }
      });
    } else {
      // Crear nuevo sector
      this.sectorService.createSector(this.sectorForm.value).subscribe({
        next: () => {
          this.successMessage = 'Sector creado correctamente';
          this.cargarSectores();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al crear sector:', error);
          this.errorMessage = error?.error?.message || 'Error al crear el sector';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarSector(sector: any): void {
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
    this.sectorAEliminar = sector;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarSector(): void {
    if (!this.sectorAEliminar) return;
    
    this.isDeletingSector = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.sectorService.deleteSector(this.sectorAEliminar.id).subscribe({
      next: () => {
        this.cargarSectores();
        this.showConfirmModal = false;
        this.sectorAEliminar = null;
        this.isDeletingSector = false;
        this.successMessage = 'Sector eliminado correctamente';
      },
      error: (error) => {
        console.error('Error al eliminar sector:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar el sector';
        this.isDeletingSector = false;
        
        // Si el error es 409 (Conflict), significaría que el sector está siendo usado
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