import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TarifaService } from '../services/tarifa.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tarifas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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

  // ✅ Variables de permisos
  tienePermisoLeer: boolean = false;
  tienePermisoCrear: boolean = false;
  tienePermisoActualizar: boolean = false;
  tienePermisoEliminar: boolean = false;
  
  constructor(
    private fb: FormBuilder,
    private tarifaService: TarifaService,
    private authService: AuthService
  ) {
    this.tarifaForm = this.fb.group({
      valor: ['', [Validators.required, Validators.min(0.01)]]
    });
  }
  
  ngOnInit(): void {
    // ✅ Verificar permisos
    this.verificarPermisos();

    // ✅ Solo cargar si tiene permiso de lectura
    if (this.tienePermisoLeer) {
      this.cargarTarifas();
    }
  }

  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('tarifas.leer');
    this.tienePermisoCrear = this.authService.hasPermission('tarifas.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('tarifas.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('tarifas.eliminar');
    
    console.log('🔐 Permisos en tarifas:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Crear:', this.tienePermisoCrear);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }
  
  get f() { return this.tarifaForm.controls; }
  
  cargarTarifas(): void {
    if (!this.tienePermisoLeer) {
      console.log('❌ Sin permisos para leer tarifas');
      return;
    }

    this.isLoading = true;
    this.tarifaService.getAllTarifas().subscribe({
      next: (data) => {
        this.tarifas = data;
        this.isLoading = false;
        console.log('✅ Tarifas cargadas:', this.tarifas.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar tarifas:', error);
        this.errorMessage = 'Error al cargar las tarifas. Por favor, intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
  
  guardarTarifa(): void {
    // ✅ Verificar permisos
    if (this.modoEdicion && !this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar tarifas.');
      return;
    }
    if (!this.modoEdicion && !this.tienePermisoCrear) {
      alert('No tienes permisos para crear tarifas.');
      return;
    }

    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (this.tarifaForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    if (this.modoEdicion) {
      console.log('📝 Actualizando tarifa:', this.tarifaEditando.id);
      this.tarifaService.updateTarifa(this.tarifaEditando.id, this.tarifaForm.value).subscribe({
        next: () => {
          this.successMessage = 'Tarifa actualizada correctamente';
          this.cargarTarifas();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al actualizar tarifa:', error);
          this.errorMessage = error?.error?.message || 'Error al actualizar la tarifa';
          this.isSubmitting = false;
        }
      });
    } else {
      console.log('➕ Creando tarifa:', this.tarifaForm.value);
      this.tarifaService.createTarifa(this.tarifaForm.value).subscribe({
        next: () => {
          this.successMessage = 'Tarifa creada correctamente';
          this.cargarTarifas();
          this.resetForm();
        },
        error: (error) => {
          console.error('❌ Error al crear tarifa:', error);
          this.errorMessage = error?.error?.message || 'Error al crear la tarifa';
          this.isSubmitting = false;
        }
      });
    }
  }
  
  editarTarifa(tarifa: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar tarifas.');
      return;
    }

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
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar tarifas.');
      return;
    }

    this.tarifaAEliminar = tarifa;
    this.showConfirmModal = true;
    this.hasError = false;
    this.errorMessage = '';
  }
  
  eliminarTarifa(): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar tarifas.');
      return;
    }

    if (!this.tarifaAEliminar) return;
    
    this.isDeletingTarifa = true;
    this.hasError = false;
    this.errorMessage = '';
    
    console.log('🗑️ Eliminando tarifa:', this.tarifaAEliminar.id);

    this.tarifaService.deleteTarifa(this.tarifaAEliminar.id).subscribe({
      next: () => {
        this.cargarTarifas();
        this.showConfirmModal = false;
        this.tarifaAEliminar = null;
        this.isDeletingTarifa = false;
        this.successMessage = 'Tarifa eliminada correctamente';
      },
      error: (error) => {
        console.error('❌ Error al eliminar tarifa:', error);
        this.hasError = true;
        this.errorMessage = error?.error?.message || 'Error al eliminar la tarifa';
        this.isDeletingTarifa = false;
        
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