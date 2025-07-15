import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlanService } from '../services/plan.service';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.css']
})
export class PlanesComponent implements OnInit {
  planForm: FormGroup;
  planes: any[] = [];
  modoEdicion = false;
  planEditando: any = null;
  planAEliminar: any = null;
  
  isLoading = false;
  isSubmitting = false;
  isDeletingPlan = false;
  submitted = false;
  
  successMessage = '';
  errorMessage = '';
  showConfirmModal = false;
  hasError = false;
  
  constructor(
    private fb: FormBuilder,
    private planService: PlanService
  ) {
    this.planForm = this.fb.group({
      nombre: ['', Validators.required],
      velocidad: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    this.cargarPlanes();
  }
  
  get f() { return this.planForm.controls; }
  
  cargarPlanes(): void {
    this.isLoading = true;
    this.planService.getAllPlanes().subscribe({
      next: (data) => {
        this.planes = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar planes:', error);
        this.errorMessage = 'Error al cargar los planes. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarPlan(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.planForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      // Actualizar plan existente
      this.planService.updatePlan(this.planEditando.id, this.planForm.value).subscribe({
        next: () => {
          this.successMessage = 'Plan actualizado correctamente';
          this.cargarPlanes();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al actualizar plan:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar el plan';
          this.isSubmitting = false;
        }
      });
    } else {
      // Crear nuevo plan
      this.planService.createPlan(this.planForm.value).subscribe({
        next: () => {
          this.successMessage = 'Plan creado correctamente';
          this.cargarPlanes();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error al crear plan:', error);
          this.errorMessage = error?.error?.message || 'Error al crear el plan';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarPlan(plan: any): void {
    this.modoEdicion = true;
    this.planEditando = plan;
    this.planForm.patchValue({
      nombre: plan.nombre,
      velocidad: plan.velocidad
    });
    this.successMessage = '';
    this.errorMessage = '';
  }
  
  cancelarEdicion(): void {
    this.resetForm();
  }
  
  confirmarEliminar(plan: any): void {
    this.planAEliminar = plan;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarPlan(): void {
    if (!this.planAEliminar) return;
    
    this.isDeletingPlan = true;
    this.hasError = false;
    this.errorMessage = '';
    
    this.planService.deletePlan(this.planAEliminar.id).subscribe({
      next: () => {
        this.cargarPlanes();
        this.showConfirmModal = false;
        this.planAEliminar = null;
        this.isDeletingPlan = false;
        this.successMessage = 'Plan eliminado correctamente';
      },
      error: (error) => {
        console.error('Error al eliminar plan:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar el plan';
        this.isDeletingPlan = false;
        
        // Si el error es 409 (Conflict), significaría que el plan está siendo usado
        if (error.status === 409) {
          this.errorMessage = 'No se puede eliminar el plan porque está siendo utilizado por uno o más clientes.';
        }
      }
    });
  }
  
  cancelarEliminacion(): void {
    this.showConfirmModal = false;
    this.planAEliminar = null;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  resetForm(): void {
    this.submitted = false;
    this.modoEdicion = false;
    this.planEditando = null;
    this.planForm.reset();
    this.isSubmitting = false;
  }
}