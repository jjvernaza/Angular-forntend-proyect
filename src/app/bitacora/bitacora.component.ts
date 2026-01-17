import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BitacoraService } from '../services/bitacora.service';
import { UserService } from '../services/user.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bitacora.component.html',
  styleUrls: ['./bitacora.component.css']
})
export class BitacoraComponent implements OnInit {

  Math = Math;
  
  // Datos
  registros: any[] = [];
  usuarios: any[] = [];
  modulos: string[] = [];
  acciones: string[] = [];
  
  // Filtros
  filtroUsuario = '';
  filtroModulo = '';
  filtroAccion = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';
  filtroBusqueda = '';
  
  // Paginación
  limit = 50;
  offset = 0;
  total = 0;
  paginaActual = 1;
  totalPaginas = 1;
  
  // Modal
  mostrarModalDetalle = false;
  registroSeleccionado: any = null;
  
  // Estados
  isLoading = false;
  isExporting = false;
  successMessage = '';
  errorMessage = '';
  
  // Permisos
  tienePermisoLeer = false;
  tienePermisoExportar = false;
  tienePermisoEstadisticas = false;
  
  // Estadísticas
  mostrarEstadisticas = false;
  estadisticas: any = null;
  isLoadingEstadisticas = false;
  
  constructor(
    private bitacoraService: BitacoraService,
    private userService: UserService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    this.verificarPermisos();
    
    if (this.tienePermisoLeer) {
      this.cargarDatos();
      this.cargarRegistros();
    }
  }
  
  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('bitacora.leer');
    this.tienePermisoExportar = this.authService.hasPermission('bitacora.exportar');
    this.tienePermisoEstadisticas = this.authService.hasPermission('bitacora.estadisticas');
    
    console.log('🔐 Permisos de bitácora:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Exportar:', this.tienePermisoExportar);
    console.log('   Estadísticas:', this.tienePermisoEstadisticas);
  }
  
  cargarDatos(): void {
    // Cargar usuarios
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
      }
    });
    
    // Cargar módulos
    this.bitacoraService.getModulos().subscribe({
      next: (data) => {
        this.modulos = data;
      },
      error: (error) => {
        console.error('❌ Error al cargar módulos:', error);
      }
    });
    
    // Cargar acciones
    this.bitacoraService.getAcciones().subscribe({
      next: (data) => {
        this.acciones = data;
      },
      error: (error) => {
        console.error('❌ Error al cargar acciones:', error);
      }
    });
  }
  
  cargarRegistros(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const filtros = {
      usuario_id: this.filtroUsuario ? parseInt(this.filtroUsuario) : undefined,
      modulo: this.filtroModulo || undefined,
      accion: this.filtroAccion || undefined,
      fecha_inicio: this.filtroFechaInicio || undefined,
      fecha_fin: this.filtroFechaFin || undefined,
      busqueda: this.filtroBusqueda || undefined,
      limit: this.limit,
      offset: this.offset
    };
    
    this.bitacoraService.getAllBitacora(filtros).subscribe({
      next: (response) => {
        this.registros = response.registros;
        this.total = response.total;
        this.totalPaginas = Math.ceil(this.total / this.limit);
        this.isLoading = false;
        
        console.log('✅ Registros cargados:', this.registros.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar registros:', error);
        this.errorMessage = 'Error al cargar registros de bitácora';
        this.isLoading = false;
      }
    });
  }
  
  aplicarFiltros(): void {
    this.offset = 0;
    this.paginaActual = 1;
    this.cargarRegistros();
  }
  
  limpiarFiltros(): void {
    this.filtroUsuario = '';
    this.filtroModulo = '';
    this.filtroAccion = '';
    this.filtroFechaInicio = '';
    this.filtroFechaFin = '';
    this.filtroBusqueda = '';
    this.aplicarFiltros();
  }
  
  cambiarPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    
    this.paginaActual = pagina;
    this.offset = (pagina - 1) * this.limit;
    this.cargarRegistros();
  }
  
  verDetalle(registro: any): void {
    this.registroSeleccionado = registro;
    this.mostrarModalDetalle = true;
  }
  
  cerrarModal(): void {
    this.mostrarModalDetalle = false;
    this.registroSeleccionado = null;
  }
  
  exportarExcel(): void {
    if (!this.tienePermisoExportar) {
      alert('No tienes permisos para exportar la bitácora.');
      return;
    }
    
    this.isExporting = true;
    this.errorMessage = '';
    
    const filtros = {
      usuario_id: this.filtroUsuario ? parseInt(this.filtroUsuario) : undefined,
      modulo: this.filtroModulo || undefined,
      accion: this.filtroAccion || undefined,
      fecha_inicio: this.filtroFechaInicio || undefined,
      fecha_fin: this.filtroFechaFin || undefined
    };
    
    this.bitacoraService.exportarBitacora(filtros).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bitacora_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.successMessage = 'Bitácora exportada exitosamente';
        this.isExporting = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al exportar:', error);
        this.errorMessage = 'Error al exportar la bitácora';
        this.isExporting = false;
      }
    });
  }
  
  cargarEstadisticas(): void {
    if (!this.tienePermisoEstadisticas) {
      alert('No tienes permisos para ver estadísticas.');
      return;
    }
    
    this.isLoadingEstadisticas = true;
    this.mostrarEstadisticas = true;
    
    this.bitacoraService.getEstadisticas(
      this.filtroFechaInicio || undefined,
      this.filtroFechaFin || undefined
    ).subscribe({
      next: (data) => {
        this.estadisticas = data;
        this.isLoadingEstadisticas = false;
        console.log('✅ Estadísticas cargadas:', data);
      },
      error: (error) => {
        console.error('❌ Error al cargar estadísticas:', error);
        this.errorMessage = 'Error al cargar estadísticas';
        this.isLoadingEstadisticas = false;
      }
    });
  }
  
  cerrarEstadisticas(): void {
    this.mostrarEstadisticas = false;
    this.estadisticas = null;
  }
  
  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  getNombreUsuario(usuarioId: number): string {
    const usuario = this.usuarios.find(u => u.ID === usuarioId);
    return usuario ? `${usuario.Nombre} ${usuario.Apellidos}` : 'Desconocido';
  }
  
  getColorAccion(accion: string): string {
    const colores: any = {
      'LOGIN': 'bg-green-100 text-green-800',
      'LOGOUT': 'bg-gray-100 text-gray-800',
      'CREAR': 'bg-blue-100 text-blue-800',
      'ACTUALIZAR': 'bg-yellow-100 text-yellow-800',
      'ELIMINAR': 'bg-red-100 text-red-800',
      'EXPORTAR': 'bg-purple-100 text-purple-800',
      'VER': 'bg-indigo-100 text-indigo-800',
      'ASIGNAR_PERMISO': 'bg-teal-100 text-teal-800',
      'REVOCAR_PERMISO': 'bg-orange-100 text-orange-800',
      'CAMBIAR_ESTADO': 'bg-pink-100 text-pink-800',
      'BUSCAR': 'bg-cyan-100 text-cyan-800'
    };
    
    return colores[accion] || 'bg-gray-100 text-gray-800';
  }
  
  getIconoAccion(accion: string): string {
    const iconos: any = {
      'LOGIN': 'fa-sign-in-alt',
      'LOGOUT': 'fa-sign-out-alt',
      'CREAR': 'fa-plus-circle',
      'ACTUALIZAR': 'fa-edit',
      'ELIMINAR': 'fa-trash',
      'EXPORTAR': 'fa-file-export',
      'VER': 'fa-eye',
      'ASIGNAR_PERMISO': 'fa-user-check',
      'REVOCAR_PERMISO': 'fa-user-times',
      'CAMBIAR_ESTADO': 'fa-toggle-on',
      'BUSCAR': 'fa-search'
    };
    
    return iconos[accion] || 'fa-info-circle';
  }
}