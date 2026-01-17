import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { PermisoService } from '../services/permiso.service';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';

interface UsuarioConPermisos {
  usuario: any;
  permisos: any[];
  permisosAsignados: any[]; // IDs de permisos asignados
}

@Component({
  selector: 'app-administrar-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './administrar-usuarios.component.html',
  styleUrls: ['./administrar-usuarios.component.css']
})
export class AdministrarUsuariosComponent implements OnInit {
  // Datos
  usuarios: any[] = [];
  usuariosFiltrados: any[] = [];
  todosLosPermisos: any[] = [];
  estados: any[] = [];
  
  // Modales
  mostrarModalEditar = false;
  mostrarModalPermisos = false;
  mostrarModalEliminar = false;
  mostrarModalVer = false;
  
  // Usuario seleccionado
  usuarioSeleccionado: any = null;
  usuarioEditando: any = null;
  usuarioPermisos: any[] = [];
  usuarioPermisosAsignados: number[] = [];
  
  // Búsqueda y filtros
  textoBusqueda = '';
  filtroEstado = 'todos';
  
  // Estados de carga
  isLoading = false;
  isLoadingPermisos = false;
  isSubmitting = false;
  
  // Mensajes
  successMessage = '';
  errorMessage = '';
  
  // Permisos del usuario actual
  tienePermisoLeer = false;
  tienePermisoActualizar = false;
  tienePermisoGestionarPermisos = false;
  tienePermisoEliminar = false;
  
  constructor(
    private userService: UserService,
    private permisoService: PermisoService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}
  
  ngOnInit(): void {
    this.verificarPermisos();
    
    if (this.tienePermisoLeer) {
      this.cargarUsuarios();
      this.cargarEstados();
      
      if (this.tienePermisoGestionarPermisos) {
        this.cargarTodosLosPermisos();
      }
    }
  }
  
  private verificarPermisos(): void {
    this.tienePermisoLeer = this.authService.hasPermission('usuarios.leer');
    this.tienePermisoActualizar = this.authService.hasPermission('usuarios.actualizar');
    this.tienePermisoGestionarPermisos = this.authService.hasPermission('usuarios.asignar_permisos');
    this.tienePermisoEliminar = this.authService.hasPermission('usuarios.eliminar');
    
    console.log('🔐 Permisos en administrar-usuarios:');
    console.log('   Leer:', this.tienePermisoLeer);
    console.log('   Actualizar:', this.tienePermisoActualizar);
    console.log('   Gestionar permisos:', this.tienePermisoGestionarPermisos);
    console.log('   Eliminar:', this.tienePermisoEliminar);
  }
  
  cargarUsuarios(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.aplicarFiltros();
        this.isLoading = false;
        console.log('✅ Usuarios cargados:', this.usuarios.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        this.errorMessage = 'Error al cargar usuarios';
        this.isLoading = false;
      }
    });
  }
  
  cargarEstados(): void {
    this.apiService.getEstados().subscribe({
      next: (data) => {
        this.estados = data;
      },
      error: (error) => {
        console.error('❌ Error al cargar estados:', error);
      }
    });
  }
  
  cargarTodosLosPermisos(): void {
    this.permisoService.getAllPermisos().subscribe({
      next: (data) => {
        this.todosLosPermisos = data;
        console.log('✅ Permisos cargados:', this.todosLosPermisos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar permisos:', error);
      }
    });
  }
  
  aplicarFiltros(): void {
    let resultado = [...this.usuarios];
    
    // Filtro por texto
    if (this.textoBusqueda.trim()) {
      const busqueda = this.textoBusqueda.toLowerCase();
      resultado = resultado.filter(usuario =>
        usuario.Nombre?.toLowerCase().includes(busqueda) ||
        usuario.Apellidos?.toLowerCase().includes(busqueda) ||
        usuario.User?.toLowerCase().includes(busqueda) ||
        usuario.Cedula?.toString().includes(busqueda) ||
        usuario.Funcion?.toLowerCase().includes(busqueda)
      );
    }
    
    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      resultado = resultado.filter(usuario => {
        const estadoNombre = this.getEstadoNombre(usuario.estado_id);
        return estadoNombre.toLowerCase() === this.filtroEstado.toLowerCase();
      });
    }
    
    this.usuariosFiltrados = resultado;
  }
  
  getEstadoNombre(estadoId: number): string {
    const estado = this.estados.find(e => e.ID === estadoId);
    return estado ? estado.Estado : 'Desconocido';
  }
  
  getEstadoClase(estadoId: number): string {
    const nombre = this.getEstadoNombre(estadoId);
    return nombre.toLowerCase() === 'activo' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }
  
  // ==========================================
  // VER DETALLES
  // ==========================================
  verDetalles(usuario: any): void {
    this.usuarioSeleccionado = { ...usuario };
    this.mostrarModalVer = true;
  }
  
  // ==========================================
  // EDITAR USUARIO
  // ==========================================
  abrirModalEditar(usuario: any): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para editar usuarios.');
      return;
    }
    
    this.usuarioEditando = { ...usuario };
    this.mostrarModalEditar = true;
    this.successMessage = '';
    this.errorMessage = '';
  }
  
  guardarEdicion(): void {
    if (!this.tienePermisoActualizar) {
      alert('No tienes permisos para actualizar usuarios.');
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = '';
    
    const datosActualizar = {
      Nombre: this.usuarioEditando.Nombre,
      Apellidos: this.usuarioEditando.Apellidos,
      Cedula: this.usuarioEditando.Cedula,
      Telefono: this.usuarioEditando.Telefono,
      Funcion: this.usuarioEditando.Funcion,
      User: this.usuarioEditando.User,
      estado_id: parseInt(this.usuarioEditando.estado_id, 10)
    };
    
    console.log('📝 Actualizando usuario:', this.usuarioEditando.ID, datosActualizar);
    
    this.userService.updateUser(this.usuarioEditando.ID, datosActualizar).subscribe({
      next: () => {
        this.successMessage = 'Usuario actualizado correctamente';
        this.mostrarModalEditar = false;
        this.cargarUsuarios();
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al actualizar usuario:', error);
        this.errorMessage = error.error?.message || 'Error al actualizar usuario';
        this.isSubmitting = false;
      }
    });
  }
  
  // ==========================================
  // GESTIONAR PERMISOS
  // ==========================================
  abrirModalPermisos(usuario: any): void {
    if (!this.tienePermisoGestionarPermisos) {
      alert('No tienes permisos para gestionar permisos de usuarios.');
      return;
    }
    
    this.usuarioSeleccionado = { ...usuario };
    this.isLoadingPermisos = true;
    this.mostrarModalPermisos = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Cargar permisos del usuario
    this.permisoService.getPermisosByUsuario(usuario.ID).subscribe({
      next: (data) => {
        this.usuarioPermisos = data;
        this.usuarioPermisosAsignados = data.map((p: any) => p.permiso_id);
        this.isLoadingPermisos = false;
        console.log('✅ Permisos del usuario cargados:', this.usuarioPermisosAsignados);
      },
      error: (error) => {
        console.error('❌ Error al cargar permisos del usuario:', error);
        this.errorMessage = 'Error al cargar permisos del usuario';
        this.isLoadingPermisos = false;
      }
    });
  }
  
  tienePermisoAsignado(permisoId: number): boolean {
    return this.usuarioPermisosAsignados.includes(permisoId);
  }
  
  togglePermiso(permisoId: number): void {
    if (!this.tienePermisoGestionarPermisos) {
      alert('No tienes permisos para gestionar permisos.');
      return;
    }
    
    const tienePermiso = this.tienePermisoAsignado(permisoId);
    
    if (tienePermiso) {
      // Revocar permiso
      this.revocarPermiso(permisoId);
    } else {
      // Asignar permiso
      this.asignarPermiso(permisoId);
    }
  }
  
  asignarPermiso(permisoId: number): void {
    console.log('➕ Asignando permiso:', permisoId, 'a usuario:', this.usuarioSeleccionado.ID);
    
    this.permisoService.assignPermiso(this.usuarioSeleccionado.ID, permisoId).subscribe({
      next: () => {
        this.usuarioPermisosAsignados.push(permisoId);
        this.successMessage = 'Permiso asignado correctamente';
        console.log('✅ Permiso asignado');
        
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error al asignar permiso:', error);
        this.errorMessage = error.error?.message || 'Error al asignar permiso';
        
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }
  
  revocarPermiso(permisoId: number): void {
    console.log('➖ Revocando permiso:', permisoId, 'del usuario:', this.usuarioSeleccionado.ID);
    
    this.permisoService.revokePermisoUsuario(this.usuarioSeleccionado.ID, permisoId).subscribe({
      next: () => {
        const index = this.usuarioPermisosAsignados.indexOf(permisoId);
        if (index > -1) {
          this.usuarioPermisosAsignados.splice(index, 1);
        }
        this.successMessage = 'Permiso revocado correctamente';
        console.log('✅ Permiso revocado');
        
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Error al revocar permiso:', error);
        this.errorMessage = error.error?.message || 'Error al revocar permiso';
        
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }
  
  // ==========================================
  // ELIMINAR USUARIO
  // ==========================================
  abrirModalEliminar(usuario: any): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar usuarios.');
      return;
    }
    
    this.usuarioSeleccionado = { ...usuario };
    this.mostrarModalEliminar = true;
    this.successMessage = '';
    this.errorMessage = '';
  }
  
  confirmarEliminar(): void {
    if (!this.tienePermisoEliminar) {
      alert('No tienes permisos para eliminar usuarios.');
      return;
    }
    
    this.isSubmitting = true;
    console.log('🗑️ Eliminando usuario:', this.usuarioSeleccionado.ID);
    
    this.userService.deleteUser(this.usuarioSeleccionado.ID).subscribe({
      next: () => {
        this.successMessage = 'Usuario eliminado correctamente';
        this.mostrarModalEliminar = false;
        this.cargarUsuarios();
        this.isSubmitting = false;
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al eliminar usuario:', error);
        this.errorMessage = error.error?.message || 'Error al eliminar usuario';
        this.isSubmitting = false;
      }
    });
  }
  
  // ==========================================
  // CERRAR MODALES
  // ==========================================
  cerrarModales(): void {
    this.mostrarModalEditar = false;
    this.mostrarModalPermisos = false;
    this.mostrarModalEliminar = false;
    this.mostrarModalVer = false;
    this.usuarioSeleccionado = null;
    this.usuarioEditando = null;
    this.errorMessage = '';
  }
}