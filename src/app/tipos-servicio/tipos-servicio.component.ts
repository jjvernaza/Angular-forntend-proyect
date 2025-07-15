import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-tipos-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit(): void {
    this.cargarTiposServicio();
  }
  
  cargarTiposServicio(): void {
    this.apiService.getTiposServicio().subscribe(
      (data: any) => {
        console.log('Tipos de servicio recibidos:', data);
        this.tiposServicio = data;
      },
      (error) => {
        console.error('Error al obtener tipos de servicio:', error);
        alert('Error al cargar tipos de servicio');
      }
    );
  }
  
  abrirModalAgregar(): void {
    this.esEdicion = false;
    this.tipoServicioForm = {
      ID: null,
      Tipo: '',
      Descripcion: ''
    };
    this.modalAbierto = true;
  }
  
  abrirModalEditar(tipo: any): void {
    this.esEdicion = true;
    this.tipoServicioForm = {
      ID: tipo.ID,
      Tipo: tipo.Tipo,
      Descripcion: tipo.Descripcion || ''
    };
    this.modalAbierto = true;
  }
  
  guardarTipoServicio(): void {
    if (!this.tipoServicioForm.Tipo.trim()) {
      alert('El tipo de servicio es obligatorio');
      return;
    }
    
    if (this.esEdicion) {
      // Actualizar
      this.apiService.updateTipoServicio(this.tipoServicioForm.ID!, this.tipoServicioForm).subscribe(
        () => {
          this.modalAbierto = false;
          this.cargarTiposServicio();
          alert('Tipo de servicio actualizado correctamente');
        },
        (error) => {
          console.error('Error al actualizar:', error);
          alert('Error al actualizar el tipo de servicio');
        }
      );
    } else {
      // Crear
      this.apiService.createTipoServicio(this.tipoServicioForm).subscribe(
        () => {
          this.modalAbierto = false;
          this.cargarTiposServicio();
          alert('Tipo de servicio creado correctamente');
        },
        (error) => {
          console.error('Error al crear:', error);
          alert('Error al crear el tipo de servicio');
        }
      );
    }
  }
  
  abrirModalEliminar(tipo: any): void {
    this.tipoEliminarId = tipo.ID;
    this.tipoEliminarNombre = tipo.Tipo;
    this.modalEliminar = true;
  }
  
  eliminarTipoServicio(): void {
    if (this.tipoEliminarId) {
      this.apiService.deleteTipoServicio(this.tipoEliminarId).subscribe(
        () => {
          this.modalEliminar = false;
          this.cargarTiposServicio();
          alert('Tipo de servicio eliminado correctamente');
        },
        (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el tipo de servicio');
        }
      );
    }
  }
  
  cerrarModal(): void {
    this.modalAbierto = false;
    this.modalEliminar = false;
  }
}