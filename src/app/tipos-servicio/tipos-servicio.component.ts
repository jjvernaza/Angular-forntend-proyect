import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tipos-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './tipos-servicio.component.html',
  styleUrls: ['./tipos-servicio.component.css']
})
export class TiposServicioComponent implements OnInit {
  tiposServicio: any[] = [];
  
  // Modal para agregar/editar
  modalAbierto = false;
  modalEliminar = false;
  esEdicion = false;
  
  // Formulario
  tipoServicioForm = {
    ID: null,
    Tipo: '',
    Descripcion: ''
  };
  
  // Para eliminar
  tipoEliminarId: number | null = null;
  tipoEliminarNombre = '';

  // ✅ Variables de permisos
  tienePermisoLeer: boolean = false;
  tienePermisoCrear: boolean = false;
  tienePermisoActualizar: boolean = false;
  tienePermisoEliminar: boolean = false;
  
  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // ✅ Verificar permisos
    this.verificarPermisos();

    // ✅ Solo cargar si tiene permiso de lectura
    if (this.tienePermisoLeer) {
      this.cargarTiposServicio();
    }
  }

  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('tipos_servicio.leer');
    this.tienePermisoCrear = this.authService.hasPermission('tipos_servicio.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('tipos_servicio.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('tipos_servicio.eliminar');
    
    console.log('🔐 Permisos en tipos de servicio:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Crear:', this.tienePermisoCrear);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }
  
  cargarTiposServicio(): void {
    if (!this.tienePermisoLeer) {
      console.log('❌ Sin permisos para leer tipos de servicio');
      return;
    }

    this.apiService.getTiposServicio().subscribe({
      next: (data: any) => {
        console.log('✅ Tipos de servicio cargados:', data.length);
        this.tiposServicio = data;
      },
      error: (error) => {
        console.error('❌ Error al obtener tipos de servicio:', error);
        alert('Error al cargar tipos de servicio');
      }
    });
  }
  
  abrirModalAgregar(): void {
    if (!this.tienePermisoCrear) {
      alert('No tienes permisos para crear tipos de servicio.');
      return;
    }

    this.esEdicion = false;
    this.tipoServicioForm = {
      ID: null,
      Tipo: '',
      Descripcion: ''
    };
    this.modalAbierto = true;
  }
  
  abrirModalEditar(tipo: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar tipos de servicio.');
      return;
    }

    this.esEdicion = true;
    this.tipoServicioForm = {
      ID: tipo.ID,
      Tipo: tipo.Tipo,
      Descripcion: tipo.Descripcion || ''
    };
    this.modalAbierto = true;
  }
  
  guardarTipoServicio(): void {
    // ✅ Verificar permisos
    if (this.esEdicion && !this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar tipos de servicio.');
      return;
    }
    if (!this.esEdicion && !this.tienePermisoCrear) {
      alert('No tienes permisos para crear tipos de servicio.');
      return;
    }

    if (!this.tipoServicioForm.Tipo.trim()) {
      alert('El tipo de servicio es obligatorio');
      return;
    }
    
    if (this.esEdicion) {
      console.log('📝 Actualizando tipo de servicio:', this.tipoServicioForm.ID);
      this.apiService.updateTipoServicio(this.tipoServicioForm.ID!, this.tipoServicioForm).subscribe({
        next: () => {
          this.modalAbierto = false;
          this.cargarTiposServicio();
          alert('Tipo de servicio actualizado correctamente');
        },
        error: (error) => {
          console.error('❌ Error al actualizar:', error);
          alert('Error al actualizar el tipo de servicio');
        }
      });
    } else {
      console.log('➕ Creando tipo de servicio:', this.tipoServicioForm);
      this.apiService.createTipoServicio(this.tipoServicioForm).subscribe({
        next: () => {
          this.modalAbierto = false;
          this.cargarTiposServicio();
          alert('Tipo de servicio creado correctamente');
        },
        error: (error) => {
          console.error('❌ Error al crear:', error);
          alert('Error al crear el tipo de servicio');
        }
      });
    }
  }
  
  abrirModalEliminar(tipo: any): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar tipos de servicio.');
      return;
    }

    this.tipoEliminarId = tipo.ID;
    this.tipoEliminarNombre = tipo.Tipo;
    this.modalEliminar = true;
  }
  
  eliminarTipoServicio(): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar tipos de servicio.');
      return;
    }

    if (this.tipoEliminarId) {
      console.log('🗑️ Eliminando tipo de servicio:', this.tipoEliminarId);
      this.apiService.deleteTipoServicio(this.tipoEliminarId).subscribe({
        next: () => {
          this.modalEliminar = false;
          this.cargarTiposServicio();
          alert('Tipo de servicio eliminado correctamente');
        },
        error: (error) => {
          console.error('❌ Error al eliminar:', error);
          alert('Error al eliminar el tipo de servicio. Puede estar en uso por clientes.');
        }
      });
    }
  }
  
  cerrarModal(): void {
    this.modalAbierto = false;
    this.modalEliminar = false;
  }
}