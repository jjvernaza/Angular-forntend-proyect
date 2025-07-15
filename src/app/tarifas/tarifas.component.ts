import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TarifaService } from '../services/tarifa.service';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tarifas.component.html',
  styleUrls: ['./tarifas.component.css']
})
export class TarifasComponent implements OnInit {
  tarifaForm: FormGroup;
  tarifas: any[] = [];
  modoEdicion = false;
  tarifaEditando: any = null;
  tarifaAEliminar: any = null;
  
  isLoading = false;
  isSubmitting = false;
  isDeletingTarifa = false;
  submitted = false;
  
  successMessage = '';
  errorMessage = '';
  showConfirmModal = false;
  hasError = false;
  
  constructor(
    private fb: FormBuilder,
    private tarifaService: TarifaService
  ) {
    this.tarifaForm = this.fb.group({
      valor: ['', [Validators.required, Validators.min(0.01)]]
    });
  }
  
  ngOnInit(): void {
    this.cargarTarifas();
  }
  
  get f() { return this.tarifaForm.controls; }
  
  cargarTarifas(): void {
    this.isLoading = true;
    this.tarifaService.getAllTarifas().subscribe({
      next: (data) => {
        this.tarifas = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar tarifas:', error);
        this.errorMessage = 'Error al cargar las tarifas. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarTarifa(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.tarifaForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      // Actualizar tarifa existente
      this.tarifaService.updateTarifa(this.tarifaEditando.id, this.tarifaForm.value).subscribe({
        next: () => {
          this.successMessage = 'Tarifa actualizada correctamente';
          this.cargarTarifas();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al actualizar tarifa:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar la tarifa';
          this.isSubmitting = false;
        }
      });
    } else {
      // Crear nueva tarifa
      this.tarifaService.createTarifa(this.tarifaForm.value).subscribe({
        next: () => {
          this.successMessage = 'Tarifa creada correctamente';
          this.cargarTarifas();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al crear tarifa:', error);
          this.errorMessage = error?.error?.message || 'Error al crear la tarifa';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarTarifa(tarifa: any): void {
    this.modoEdicion = true;
    this.tarifaEditando = tarifa;
    this.tarifaForm.patchValue({
      valor: tarifa.valor
    });
    this.successMessage = '';
    this.errorMessage = '';
  }
  
  cancelarEdicion(): void {
    this.resetForm();
  }
  
  confirmarEliminar(tarifa: any): void {
    this.tarifaAEliminar = tarifa;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarTarifa(): void {
    if (!this.tarifaAEliminar) return;
    
    this.isDeletingTarifa = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.tarifaService.deleteTarifa(this.tarifaAEliminar.id).subscribe({
      next: () => {
        this.cargarTarifas();
        this.showConfirmModal = false;
        this.tarifaAEliminar = null;
        this.isDeletingTarifa = false;
        this.successMessage = 'Tarifa eliminada correctamente';
      },
      error: (error) => {
        console.error('Error al eliminar tarifa:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar la tarifa';
        this.isDeletingTarifa = false;
        
        // Si el error es 409 (Conflict), significaría que la tarifa está siendo usada
        if (error.status === 409) {
          this.errorMessage = 'No se puede eliminar la tarifa porque está siendo utilizada por uno o más clientes.';
        }
      }
    });
  }
  
  cancelarEliminacion(): void {
    this.showConfirmModal = false;
    this.tarifaAEliminar = null;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  resetForm(): void {
    this.submitted = false;
    this.modoEdicion = false;
    this.tarifaEditando = null;
    this.tarifaForm.reset();
    this.isSubmitting = false;
  }
}