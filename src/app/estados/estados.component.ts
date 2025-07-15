import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-estados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estados.component.html',
  styleUrls: ['./estados.component.css']
})
export class EstadosComponent implements OnInit {
  estados: any[] = [];
  
  // Modal para agregar/editar
  modalAbierto = false;
  modalEliminar = false;
  esEdicion = false;
  
  // Formulario
  estadoForm = {
    ID: null,
    Estado: '',
    Color: '#22c55e' // Verde por defecto
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
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit(): void {
    this.cargarEstados();
  }
  
  cargarEstados(): void {
    this.apiService.getEstados().subscribe(
      (data: any) => {
        console.log('Estados recibidos:', data);
        this.estados = data;
      },
      (error) => {
        console.error('Error al obtener estados:', error);
        alert('Error al cargar estados: ' + (error.error?.message || 'Error desconocido'));
      }
    );
  }
  
  abrirModalAgregar(): void {
    this.esEdicion = false;
    this.estadoForm = {
      ID: null,
      Estado: '',
      Color: '#22c55e'
    };
    this.modalAbierto = true;
  }
  
  abrirModalEditar(estado: any): void {
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
      // Actualizar
      this.apiService.updateEstado(this.estadoForm.ID!, this.estadoForm).subscribe(
        () => {
          this.modalAbierto = false;
          this.cargarEstados();
          alert('Estado actualizado correctamente');
        },
        (error) => {
          console.error('Error al actualizar:', error);
          alert('Error al actualizar el estado: ' + (error.error?.message || 'Error desconocido'));
        }
      );
    } else {
      // Crear
      this.apiService.createEstado(this.estadoForm).subscribe(
        () => {
          this.modalAbierto = false;
          this.cargarEstados();
          alert('Estado creado correctamente');
        },
        (error) => {
          console.error('Error al crear:', error);
          alert('Error al crear el estado: ' + (error.error?.message || 'Error desconocido'));
        }
      );
    }
  }
  
  abrirModalEliminar(estado: any): void {
    this.estadoEliminarId = estado.ID;
    this.estadoEliminarNombre = estado.Estado;
    this.modalEliminar = true;
  }
  
  eliminarEstado(): void {
    if (this.estadoEliminarId) {
      this.apiService.deleteEstado(this.estadoEliminarId).subscribe(
        () => {
          this.modalEliminar = false;
          this.cargarEstados();
          alert('Estado eliminado correctamente');
        },
        (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el estado: ' + (error.error?.message || 'Error desconocido'));
        }
      );
    }
  }
  
  cerrarModal(): void {
    this.modalAbierto = false;
    this.modalEliminar = false;
  }
  
  // Método para obtener el color de fondo según el estado
  getEstadoColor(estado: string): string {
    switch(estado?.toLowerCase()) {
      case 'activo': return '#22c55e';
      case 'inactivo': return '#ef4444';
      case 'suspendido': return '#eab308';
      case 'prueba': return '#3b82f6';
      case 'mantenimiento': return '#8b5cf6';
      default: return '#6b7280';
    }
  }
  
  // Método para obtener el color de texto según el fondo
  getTextColor(backgroundColor: string): string {
    if (!backgroundColor) return '#000000';
    
    // Convertir hex a RGB y calcular luminosidad
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminosity > 0.5 ? '#000000' : '#ffffff';
  }
}