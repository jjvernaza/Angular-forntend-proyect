import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlanService } from '../services/plan.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  // ✅ Variables de permisos
  tienePermisoLeer: boolean = false;
  tienePermisoCrear: boolean = false;
  tienePermisoActualizar: boolean = false;
  tienePermisoEliminar: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private planService: PlanService,
    private authService: AuthService
  ) {
    this.planForm = this.fb.group({
      nombre: ['', Validators.required],
      velocidad: ['', Validators.required]
    });
  }
  
  ngOnInit(): void {
    // ✅ Verificar permisos
    this.verificarPermisos();

    // ✅ Solo cargar si tiene permiso de lectura
    if (this.tienePermisoLeer) {
      this.cargarPlanes();
    }
  }

  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('planes.leer');
    this.tienePermisoCrear = this.authService.hasPermission('planes.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('planes.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('planes.eliminar');
    
    console.log('🔐 Permisos en planes:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Crear:', this.tienePermisoCrear);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }
  
  get f() { return this.planForm.controls; }
  
  cargarPlanes(): void {
    if (!this.tienePermisoLeer) {
      console.log('❌ Sin permisos para leer planes');
      return;
    }

    this.isLoading = true;
    this.planService.getAllPlanes().subscribe({
      next: (data) => {
        this.planes = data;
        this.isLoading = false;
        console.log('✅ Planes cargados:', this.planes.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar planes:', error);
        this.errorMessage = 'Error al cargar los planes. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarPlan(): void {
    // ✅ Verificar permisos
    if (this.modoEdicion && !this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar planes.');
      return;
    }
    if (!this.modoEdicion && !this.tienePermisoCrear) {
      alert('No tienes permisos para crear planes.');
      return;
    }

    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.planForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      console.log('📝 Actualizando plan:', this.planEditando.id);
      this.planService.updatePlan(this.planEditando.id, this.planForm.value).subscribe({
        next: () => {
          this.successMessage = 'Plan actualizado correctamente';
          this.cargarPlanes();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al actualizar plan:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar el plan';
          this.isSubmitting = false;
        }
      });
    } else {
      console.log('➕ Creando plan:', this.planForm.value);
      this.planService.createPlan(this.planForm.value).subscribe({
        next: () => {
          this.successMessage = 'Plan creado correctamente';
          this.cargarPlanes();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al crear plan:', error);
          this.errorMessage = error?.error?.message || 'Error al crear el plan';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarPlan(plan: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar planes.');
      return;
    }

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
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar planes.');
      return;
    }

    this.planAEliminar = plan;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarPlan(): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar planes.');
      return;
    }

    if (!this.planAEliminar) return;
    
    this.isDeletingPlan = true;
    this.hasError = false;
    this.errorMessage = '';
    
    console.log('🗑️ Eliminando plan:', this.planAEliminar.id);

    this.planService.deletePlan(this.planAEliminar.id).subscribe({
      next: () => {
        this.cargarPlanes();
        this.showConfirmModal = false;
        this.planAEliminar = null;
        this.isDeletingPlan = false;
        this.successMessage = 'Plan eliminado correctamente';
      },
      error: (error) => {
        console.error('❌ Error al eliminar plan:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar el plan';
        this.isDeletingPlan = false;
        
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