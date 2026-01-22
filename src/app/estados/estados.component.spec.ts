import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

type EstadoForm = {
  ID: number | null;
  Estado: string;
  Color: string;
};

@Component({
  selector: 'app-estados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './estados.component.html',
  styleUrls: ['./estados.component.css']
})
export class EstadosComponent implements OnInit {
  estados: any[] = [];

  // Modal para agregar/editar
  modalAbierto = false;
  modalEliminar = false;
  esEdicion = false;

  // ✅ Formulario tipado (ID puede ser number o null)
  estadoForm: EstadoForm = {
    ID: null,
    Estado: '',
    Color: '#22c55e'
  };

  // Para eliminar
  estadoEliminarId: number | null = null;
  estadoEliminarNombre = '';

  // Colores predefinidos para estados
  coloresEstado = [
    { nombre: 'Verde (Activo)', valor: '#22c55e' },
    { nombre: 'Rojo (Inactivo)', valor: '#ef4444' },
    { nombre: 'Amarillo (Suspendido)', valor: '#eab308' },
    { nombre: 'Azul (Prueba)', valor: '#3b82f6' },
    { nombre: 'Morado (Mantenimiento)', valor: '#8b5cf6' },
    { nombre: 'Gris (Pendiente)', valor: '#6b7280' }
  ];

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
    this.verificarPermisos();

    if (this.tienePermisoLeer) {
      this.cargarEstados();
    }
  }

  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('estados.leer');
    this.tienePermisoCrear = this.authService.hasPermission('estados.crear');
    this.tienePermisoActualizar = this.authService.hasPermission('estados.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('estados.eliminar');

    console.log('🔐 Permisos en estados:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Crear:', this.tienePermisoCrear);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }

  cargarEstados(): void {
    if (!this.tienePermisoLeer) {
      console.log('❌ Sin permisos para leer estados');
      return;
    }

    this.apiService.getEstados().subscribe(
      (data: any) => {
        console.log('✅ Estados recibidos:', data);
        this.estados = data;
      },
      (error) => {
        console.error('❌ Error al obtener estados:', error);
        alert('Error al cargar estados: ' + (error.error?.message || 'Error desconocido'));
      }
    );
  }

  abrirModalAgregar(): void {
    if (!this.tienePermisoCrear) {
      alert('No tienes permisos para crear estados.');
      return;
    }

    this.esEdicion = false;
    this.estadoForm = {
      ID: null,
      Estado: '',
      Color: '#22c55e'
    };
    this.modalAbierto = true;
  }

  abrirModalEditar(estado: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar estados.');
      return;
    }

    this.esEdicion = true;
    this.estadoForm = {
      ID: estado.ID,
      Estado: estado.Estado,
      Color: estado.Color || '#22c55e'
    };
    this.modalAbierto = true;
  }

  guardarEstado(): void {
    if (!this.estadoForm.Estado.trim()) {
      alert('El nombre del estado es obligatorio');
      return;
    }

    if (this.esEdicion) {
      if (!this.tienePermisoActualizar) {
        alert('No tienes permisos para actualizar estados.');
        return;
      }

      if (this.estadoForm.ID == null) {
        alert('Error: ID del estado inválido');
        return;
      }

      console.log('📝 Actualizando estado:', this.estadoForm);
      this.apiService.updateEstado(this.estadoForm.ID, this.estadoForm).subscribe(
        () => {
          this.modalAbierto = false;
          this.cargarEstados();
          alert('Estado actualizado correctamente');
        },
        (error) => {
          console.error('❌ Error al actualizar:', error);
          alert('Error al actualizar el estado: ' + (error.error?.message || 'Error desconocido'));
        }
      );
    } else {
      if (!this.tienePermisoCrear) {
        alert('No tienes permisos para crear estados.');
        return;
      }

      console.log('➕ Creando estado:', this.estadoForm);
      this.apiService.createEstado(this.estadoForm).subscribe(
        () => {
          this.modalAbierto = false;
          this.cargarEstados();
          alert('Estado creado correctamente');
        },
        (error) => {
          console.error('❌ Error al crear:', error);
          alert('Error al crear el estado: ' + (error.error?.message || 'Error desconocido'));
        }
      );
    }
  }

  abrirModalEliminar(estado: any): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar estados.');
      return;
    }

    this.estadoEliminarId = estado.ID;
    this.estadoEliminarNombre = estado.Estado;
    this.modalEliminar = true;
  }

  eliminarEstado(): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar estados.');
      return;
    }

    if (this.estadoEliminarId) {
      console.log('🗑️ Eliminando estado:', this.estadoEliminarId);
      this.apiService.deleteEstado(this.estadoEliminarId).subscribe(
        () => {
          this.modalEliminar = false;
          this.cargarEstados();
          alert('Estado eliminado correctamente');
        },
        (error) => {
          console.error('❌ Error al eliminar:', error);
          alert('Error al eliminar el estado: ' + (error.error?.message || 'Error desconocido'));
        }
      );
    }
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.modalEliminar = false;
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'activo': return '#22c55e';
      case 'inactivo': return '#ef4444';
      case 'suspendido': return '#eab308';
      case 'prueba': return '#3b82f6';
      case 'mantenimiento': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getTextColor(backgroundColor: string): string {
    if (!backgroundColor) return '#000000';

    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminosity > 0.5 ? '#000000' : '#ffffff';
  }
}
