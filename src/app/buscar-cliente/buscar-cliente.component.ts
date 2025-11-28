import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-buscar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './buscar-cliente.component.html',
  styleUrls: ['./buscar-cliente.component.css']
})
export class BuscarClienteComponent implements OnInit {
  clientes: any[] = [];
  tiposServicio: any[] = [];
  estados: any[] = [];
  planes: any[] = [];
  sectores: any[] = [];
  tarifas: any[] = [];
  
  filtro = { id: '', nombre: '', cedula: '', ubicacion: '' };
  
  modalEditar = false;
  modalEliminar = false;
  clienteEdit: any = {};
  clienteEliminarId: number | null = null;
  
  constructor(private apiService: ApiService) {}
  
  ngOnInit(): void {
    this.cargarClientes();
    this.cargarTiposServicio();
    this.cargarEstados();
    this.cargarPlanes();
    this.cargarSectores();
    this.cargarTarifas();
  }
  
  cargarClientes(): void {
    this.apiService.getClientes().subscribe(
      (data: any) => {
        console.log('Datos de clientes recibidos:', data);
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
        alert('Error al cargar clientes: ' + (error.error?.message || 'Error desconocido'));
      }
    );
  }
  
  cargarTiposServicio(): void {
    this.apiService.getTiposServicio().subscribe(
      (data: any) => {
        this.tiposServicio = data;
      },
      (error) => {
        console.error('Error al obtener tipos de servicio:', error);
        alert('Error al cargar tipos de servicio');
      }
    );
  }

  cargarEstados(): void {
    this.apiService.getEstados().subscribe(
      (data: any) => {
        console.log('Estados recibidos:', data);
        this.estados = data;
      },
      (error) => {
        console.error('Error al obtener estados:', error);
        alert('Error al cargar estados');
      }
    );
  }

  cargarPlanes(): void {
    this.apiService.getPlanes().subscribe(
      (data: any) => {
        console.log('Planes recibidos:', data);
        this.planes = data;
      },
      (error) => {
        console.error('Error al obtener planes:', error);
        alert('Error al cargar planes');
      }
    );
  }

  cargarSectores(): void {
    this.apiService.getSectores().subscribe(
      (data: any) => {
        this.sectores = data;
      },
      (error) => {
        console.error('Error al obtener sectores:', error);
        alert('Error al cargar sectores');
      }
    );
  }

  cargarTarifas(): void {
    this.apiService.getTarifas().subscribe(
      (data: any) => {
        this.tarifas = data;
      },
      (error) => {
        console.error('Error al obtener tarifas:', error);
        alert('Error al cargar tarifas');
      }
    );
  }
  
  buscarClientes() {
    this.apiService.getClientes().subscribe(
      (data: any[]) => {
        this.clientes = data.filter((cliente: any) =>
          (this.filtro.id ? cliente.ID.toString() === this.filtro.id.trim() : true) &&
          (this.filtro.nombre ? 
            (cliente.NombreCliente?.toLowerCase().includes(this.filtro.nombre.toLowerCase()) ||
             cliente.ApellidoCliente?.toLowerCase().includes(this.filtro.nombre.toLowerCase())) : true) &&
          (this.filtro.cedula ? cliente.Cedula?.trim() === this.filtro.cedula.trim() : true) &&
          (this.filtro.ubicacion ? cliente.Ubicacion?.toLowerCase().includes(this.filtro.ubicacion.toLowerCase().trim()) : true)
        );
      },
      (error) => {
        console.error('Error al filtrar clientes:', error);
        alert('Error al filtrar clientes: ' + (error.error?.message || 'Error desconocido'));
      }
    );
  }
  
  abrirModalEditar(cliente: any) {
    this.clienteEdit = { 
      ...cliente,
      plan_mb_id: cliente.plan_mb_id || cliente.plan?.id,
      tarifa_id: cliente.tarifa_id || cliente.tarifa?.id,
      sector_id: cliente.sector_id || cliente.sector?.id,
      EstadoID: cliente.EstadoID || cliente.estado?.ID,
      TipoServicioID: cliente.TipoServicioID || cliente.tipoServicio?.ID
    };
    
    if (this.clienteEdit.FechaInstalacion) {
      const fecha = new Date(this.clienteEdit.FechaInstalacion);
      this.clienteEdit.FechaInstalacion = fecha.toISOString().split('T')[0];
    }
    
    this.modalEditar = true;
  }
  
  guardarEdicion() {
    const clienteParaActualizar = { ...this.clienteEdit };
    
    if (!clienteParaActualizar.plan_mb_id) clienteParaActualizar.plan_mb_id = null;
    if (!clienteParaActualizar.tarifa_id) clienteParaActualizar.tarifa_id = null;
    if (!clienteParaActualizar.sector_id) clienteParaActualizar.sector_id = null;
    if (!clienteParaActualizar.EstadoID) clienteParaActualizar.EstadoID = null;
    if (!clienteParaActualizar.TipoServicioID) clienteParaActualizar.TipoServicioID = null;
    
    this.apiService.updateCliente(this.clienteEdit.ID, clienteParaActualizar).subscribe(
      () => {
        this.modalEditar = false;
        this.cargarClientes();
        alert('Cliente actualizado correctamente');
      },
      (error) => {
        console.error('Error al actualizar cliente:', error);
        alert('Error al actualizar cliente: ' + (error.error?.message || 'Error desconocido'));
      }
    );
  }
  
  abrirModalEliminar(id: number) {
    if (id == null || id <= 0) {
      console.error('ID de cliente inválido:', id);
      alert('Error: ID de cliente inválido');
      return;
    }
    this.clienteEliminarId = id;
    this.modalEliminar = true;
  }
  
  eliminarCliente() {
    if (this.clienteEliminarId == null || this.clienteEliminarId <= 0) {
      console.error('No se puede eliminar: ID de cliente no válido:', this.clienteEliminarId);
      alert('Error: ID de cliente no válido');
      this.modalEliminar = false;
      return;
    }
    
    this.apiService.deleteCliente(this.clienteEliminarId).subscribe(
      () => {
        this.modalEliminar = false;
        this.clienteEliminarId = null;
        this.cargarClientes();
        alert('Cliente eliminado correctamente');
      },
      (error) => {
        console.error('Error al eliminar cliente:', error);
        let errorMessage = 'Error al eliminar cliente';
        if (error.status === 500) {
          errorMessage += ': Error interno del servidor';
          if (error.error?.message) {
            errorMessage += ` - ${error.error.message}`;
          }
        } else if (error.status === 404) {
          errorMessage += ': Cliente no encontrado';
        } else if (error.status === 403) {
          errorMessage += ': Permiso denegado';
        }
        alert(errorMessage);
      }
    );
  }

  getEstadoColorByName(estado: string): string {
    if (!estado) return '#6b7280';
    
    switch(estado.toLowerCase()) {
      case 'activo': return '#22c55e';
      case 'inactivo': return '#ef4444';
      case 'suspendido': return '#eab308';
      case 'prueba': return '#3b82f6';
      case 'mantenimiento': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getTextColorForBg(backgroundColor: string): string {
    if (!backgroundColor) return '#000000';
    
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminosity > 0.5 ? '#000000' : '#ffffff';
  }
}