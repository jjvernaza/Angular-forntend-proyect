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
        console.log('Datos de clientes recibidos:', data); // Para debugging
        this.clientes = data;
      },
      (error) => {
        console.error('Error al obtener clientes:', error);
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
      }
    );
  }
  
  buscarClientes() {
    this.apiService.getClientes().subscribe(
      (data: any[]) => {
        this.clientes = data.filter((cliente: any) =>
          // ✅ ID: Coincidencia exacta
          (this.filtro.id ? cliente.ID.toString() === this.filtro.id.trim() : true) &&
          
          // ✅ Nombre: Búsqueda parcial sin importar mayúsculas/minúsculas (busca en nombre y apellido)
          (this.filtro.nombre ? 
            (cliente.NombreCliente?.toLowerCase().includes(this.filtro.nombre.toLowerCase()) ||
             cliente.ApellidoCliente?.toLowerCase().includes(this.filtro.nombre.toLowerCase())) : true) &&
          
          // ✅ Cédula: Coincidencia exacta
          (this.filtro.cedula ? cliente.Cedula?.trim() === this.filtro.cedula.trim() : true) &&
          
          // ✅ Ubicación: Asegurando que no es null y comparando correctamente
          (this.filtro.ubicacion ? cliente.Ubicacion?.toLowerCase().includes(this.filtro.ubicacion.toLowerCase().trim()) : true)
        );
      },
      (error) => {
        console.error('Error al filtrar clientes:', error);
      }
    );
  }
  
  abrirModalEditar(cliente: any) {
    this.clienteEdit = { 
      ...cliente,
      // Asegurar que tenemos los IDs correctos para las relaciones
      plan_mb_id: cliente.plan_mb_id || cliente.plan?.id,
      tarifa_id: cliente.tarifa_id || cliente.tarifa?.id,
      sector_id: cliente.sector_id || cliente.sector?.id,
      EstadoID: cliente.EstadoID || cliente.estado?.ID,
      TipoServicioID: cliente.TipoServicioID || cliente.tipoServicio?.ID
    };
    
    // Formatear la fecha para el input type="date"
    if (this.clienteEdit.FechaInstalacion) {
      const fecha = new Date(this.clienteEdit.FechaInstalacion);
      this.clienteEdit.FechaInstalacion = fecha.toISOString().split('T')[0];
    }
    
    this.modalEditar = true;
  }
  
  guardarEdicion() {
    // Limpiar campos vacíos antes de enviar
    const clienteParaActualizar = { ...this.clienteEdit };
    
    // Convertir strings vacíos a null para los IDs
    if (!clienteParaActualizar.plan_mb_id) clienteParaActualizar.plan_mb_id = null;
    if (!clienteParaActualizar.tarifa_id) clienteParaActualizar.tarifa_id = null;
    if (!clienteParaActualizar.sector_id) clienteParaActualizar.sector_id = null;
    if (!clienteParaActualizar.EstadoID) clienteParaActualizar.EstadoID = null;
    if (!clienteParaActualizar.TipoServicioID) clienteParaActualizar.TipoServicioID = null;
    
    this.apiService.updateCliente(this.clienteEdit.ID, clienteParaActualizar).subscribe(
      () => {
        this.modalEditar = false;
        this.cargarClientes(); // Recargar clientes
        alert('Cliente actualizado correctamente');
      },
      (error) => {
        console.error('Error al actualizar cliente:', error);
        alert('Error al actualizar cliente: ' + (error.error?.message || 'Error desconocido'));
      }
    );
  }
  
  abrirModalEliminar(id: number) {
    this.clienteEliminarId = id;
    this.modalEliminar = true;
  }
  
  eliminarCliente() {
    if (this.clienteEliminarId !== null) {
      this.apiService.deleteCliente(this.clienteEliminarId).subscribe(
        () => {
          this.modalEliminar = false;
          this.cargarClientes(); // Recargar lista después de eliminar
          alert('Cliente eliminado correctamente');
        },
        (error) => {
          console.error('Error al eliminar cliente:', error);
          alert('Error al eliminar cliente');
        }
      );
    }
  }

  // Método para aplicar colores según el estado por nombre (fallback)
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

  // Método para obtener el color de texto según el fondo
  getTextColorForBg(backgroundColor: string): string {
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