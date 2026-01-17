import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
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
  clientesSinFiltrar: any[] = [];  // ✅ Para guardar todos los clientes
  tiposServicio: any[] = [];
  estados: any[] = [];
  planes: any[] = [];
  sectores: any[] = [];
  tarifas: any[] = [];
  
  // ✅ Filtros actualizados con apellido y teléfono
  filtro = { 
    id: '', 
    nombre: '', 
    apellido: '',  // ✅ NUEVO
    cedula: '', 
    telefono: '',  // ✅ NUEVO
    ubicacion: '' 
  };
  
  modalEditar = false;
  modalEliminar = false;
  clienteEdit: any = {};
  clienteEliminarId: number | null = null;
  
  // Variables de permisos
  tienePermisoLeer: boolean = false;
  tienePermisoActualizar: boolean = false;
  tienePermisoEliminar: boolean = false;
  
  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.verificarPermisos();
    
    if (this.tienePermisoLeer) {
      this.cargarClientes();
      this.cargarTiposServicio();
      this.cargarEstados();
      this.cargarPlanes();
      this.cargarSectores();
      this.cargarTarifas();
    }
  }
  
  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasAnyPermission(['clientes.leer', 'clientes.buscar_avanzado']);
    this.tienePermisoActualizar = this.authService.hasPermission('clientes.actualizar');
    this.tienePermisoEliminar = this.authService.hasPermission('clientes.eliminar');
    
    console.log('🔐 Permisos en buscar-cliente:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }
  
  mostrarMensajePermisos(accion: string): void {
    alert(`No tienes permisos para ${accion} clientes.`);
  }
  
  cargarClientes(): void {
    if (!this.tienePermisoLeer) {
      console.log('❌ Sin permiso para cargar clientes');
      return;
    }
    
    this.apiService.getClientes().subscribe(
      (data: any) => {
        console.log('✅ Clientes cargados:', data.length);
        this.clientesSinFiltrar = data;  // ✅ Guardar copia completa
        this.clientes = data;  // Mostrar todos inicialmente
      },
      (error) => {
        console.error('❌ Error al obtener clientes:', error);
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
      }
    );
  }

  cargarEstados(): void {
    this.apiService.getEstados().subscribe(
      (data: any) => {
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
  
  // ✅ Función de búsqueda mejorada con apellido y teléfono
  buscarClientes() {
    if (!this.tienePermisoLeer) {
      alert('No tienes permisos para buscar clientes.');
      return;
    }
    
    console.log('🔍 Aplicando filtros:', this.filtro);
    
    this.clientes = this.clientesSinFiltrar.filter((cliente: any) => {
      // Filtro por ID
      const cumpleID = this.filtro.id ? 
        cliente.ID.toString() === this.filtro.id.trim() : true;
      
      // Filtro por Nombre
      const cumpleNombre = this.filtro.nombre ? 
        cliente.NombreCliente?.toLowerCase().includes(this.filtro.nombre.toLowerCase().trim()) : true;
      
      // ✅ NUEVO: Filtro por Apellido
      const cumpleApellido = this.filtro.apellido ? 
        cliente.ApellidoCliente?.toLowerCase().includes(this.filtro.apellido.toLowerCase().trim()) : true;
      
      // Filtro por Cédula
      const cumpleCedula = this.filtro.cedula ? 
        cliente.Cedula?.trim() === this.filtro.cedula.trim() : true;
      
      // ✅ NUEVO: Filtro por Teléfono
      const cumpleTelefono = this.filtro.telefono ? 
        cliente.Telefono?.includes(this.filtro.telefono.trim()) : true;
      
      // Filtro por Ubicación
      const cumpleUbicacion = this.filtro.ubicacion ? 
        cliente.Ubicacion?.toLowerCase().includes(this.filtro.ubicacion.toLowerCase().trim()) : true;
      
      return cumpleID && cumpleNombre && cumpleApellido && cumpleCedula && cumpleTelefono && cumpleUbicacion;
    });
    
    console.log(`✅ Resultados de búsqueda: ${this.clientes.length} de ${this.clientesSinFiltrar.length}`);
  }
  
  // ✅ NUEVA: Función para limpiar filtros
  limpiarFiltros(): void {
    this.filtro = { 
      id: '', 
      nombre: '', 
      apellido: '', 
      cedula: '', 
      telefono: '', 
      ubicacion: '' 
    };
    this.clientes = [...this.clientesSinFiltrar];  // Restaurar todos los clientes
    console.log('🧹 Filtros limpiados');
  }
  
  abrirModalEditar(cliente: any) {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar clientes.');
      return;
    }
    
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
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar clientes.');
      return;
    }
    
    const clienteParaActualizar = { ...this.clienteEdit };
    
    if (!clienteParaActualizar.plan_mb_id) clienteParaActualizar.plan_mb_id = null;
    if (!clienteParaActualizar.tarifa_id) clienteParaActualizar.tarifa_id = null;
    if (!clienteParaActualizar.sector_id) clienteParaActualizar.sector_id = null;
    if (!clienteParaActualizar.EstadoID) clienteParaActualizar.EstadoID = null;
    if (!clienteParaActualizar.TipoServicioID) clienteParaActualizar.TipoServicioID = null;
    
    console.log('💾 Actualizando cliente:', clienteParaActualizar);
    
    this.apiService.updateCliente(this.clienteEdit.ID, clienteParaActualizar).subscribe(
      () => {
        console.log('✅ Cliente actualizado');
        this.modalEditar = false;
        this.cargarClientes();
        alert('Cliente actualizado correctamente');
      },
      (error) => {
        console.error('❌ Error al actualizar cliente:', error);
        alert('Error al actualizar cliente: ' + (error.error?.message || 'Error desconocido'));
      }
    );
  }
  
  abrirModalEliminar(id: number) {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar clientes.');
      return;
    }
    
    if (id == null || id <= 0) {
      console.error('ID de cliente inválido:', id);
      alert('Error: ID de cliente inválido');
      return;
    }
    
    this.clienteEliminarId = id;
    this.modalEliminar = true;
  }
  
  eliminarCliente() {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar clientes.');
      return;
    }
    
    if (this.clienteEliminarId == null || this.clienteEliminarId <= 0) {
      console.error('No se puede eliminar: ID de cliente no válido:', this.clienteEliminarId);
      alert('Error: ID de cliente no válido');
      this.modalEliminar = false;
      return;
    }
    
    console.log('🗑️ Eliminando cliente ID:', this.clienteEliminarId);
    
    this.apiService.deleteCliente(this.clienteEliminarId).subscribe(
      () => {
        console.log('✅ Cliente eliminado');
        this.modalEliminar = false;
        this.clienteEliminarId = null;
        this.cargarClientes();
        alert('Cliente eliminado correctamente');
      },
      (error) => {
        console.error('❌ Error al eliminar cliente:', error);
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
        this.modalEliminar = false;
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