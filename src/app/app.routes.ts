// src/app/app.routes.ts
import { Routes } from '@angular/router';

// ✅ Importaciones de componentes existentes
import { DashboardComponent } from './dashboard/dashboard.component';
import { LoginComponent } from './login/login.component';
import { CrearUsuarioComponent } from './crear-usuario/crear-usuario.component';
import { BuscarClienteComponent } from './buscar-cliente/buscar-cliente.component';
import { AgregarClienteComponent } from './agregar-cliente/agregar-cliente.component';
import { MorososComponent } from './morosos/morosos.component';
import { AgregarPagoComponent } from './agregar-pago/agregar-pago.component';

// ✅ Importaciones de componentes de administración
import { PlanesComponent } from './planes/planes.component';
import { SectoresComponent } from './sectores/sectores.component';
import { TarifasComponent } from './tarifas/tarifas.component';
import { PermisosComponent } from './permisos/permisos.component';
import { AdministrarUsuariosComponent } from './administrar-usuarios/administrar-usuarios.component';
import { BitacoraComponent } from './bitacora/bitacora.component';

// ✅ Importaciones de los componentes adicionales
import { TiposServicioComponent } from './tipos-servicio/tipos-servicio.component';
import { EstadosComponent } from './estados/estados.component';

// ✅ Importaciones de Guards
import { AuthGuard } from './auth.guard';
import { PermissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  // ============================================
  // RUTA PÚBLICA - LOGIN (SIN GUARDS)
  // ============================================
  { 
    path: 'login', 
    component: LoginComponent 
  },
  
  // ============================================
  // RUTA RAÍZ - REDIRECCIÓN
  // ============================================
  { 
    path: '', 
    redirectTo: '/login', 
    pathMatch: 'full' 
  },
  
  // ============================================
  // RUTAS PROTEGIDAS CON AUTENTICACIÓN Y PERMISOS
  // ============================================
  
  // Dashboard - Requiere autenticación y permiso
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['dashboard.ver'] }
  },
  
  // ============================================
  // GESTIÓN DE USUARIOS
  // ============================================
  { 
    path: 'administrar-usuarios', 
    component: AdministrarUsuariosComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['usuarios.leer'] }
  },
  { 
    path: 'crear-usuario', 
    component: CrearUsuarioComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['usuarios.crear'] }
  },
  
  // ============================================
  // GESTIÓN DE CLIENTES
  // ============================================
  { 
    path: 'buscar-cliente', 
    component: BuscarClienteComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['clientes.leer', 'clientes.buscar_avanzado'] }
  },
  { 
    path: 'agregar-cliente', 
    component: AgregarClienteComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['clientes.crear'] }
  },
  
  // ============================================
  // GESTIÓN DE MOROSOS
  // ============================================
  { 
    path: 'morosos', 
    component: MorososComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['morosos.ver', 'morosos.filtrar', 'morosos.exportar', 'morosos.gestionar'] }
  },
  
  // ============================================
  // GESTIÓN DE PAGOS
  // ============================================
  { 
    path: 'agregar-pago', 
    component: AgregarPagoComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['pagos.crear', 'pagos.leer'] }
  },
  
  // ============================================
  // ADMINISTRACIÓN - PLANES
  // ============================================
  { 
    path: 'planes', 
    component: PlanesComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['planes.leer'] }
  },
  
  // ============================================
  // ADMINISTRACIÓN - SECTORES
  // ============================================
  { 
    path: 'sectores', 
    component: SectoresComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['sectores.leer'] }
  },
  
  // ============================================
  // ADMINISTRACIÓN - TARIFAS
  // ============================================
  { 
    path: 'tarifas', 
    component: TarifasComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['tarifas.leer'] }
  },
  
  // ============================================
  // ADMINISTRACIÓN - PERMISOS
  // ============================================
  { 
    path: 'permisos', 
    component: PermisosComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['usuarios.asignar_permisos'] }
  },
  
  // ============================================
  // ADMINISTRACIÓN - TIPOS DE SERVICIO
  // ============================================
  { 
    path: 'tipos-servicio', 
    component: TiposServicioComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['servicios.leer'] }
  },
  
  // ============================================
  // ADMINISTRACIÓN - ESTADOS
  // ============================================
  { 
    path: 'estados', 
    component: EstadosComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['estados.leer'] }
  },

  // ============================================
  // ADMINISTRACIÓN - BITÁCORA
  // ============================================
  { 
    path: 'bitacora', 
    component: BitacoraComponent, 
    canActivate: [AuthGuard, PermissionGuard],
    data: { permissions: ['bitacora.leer'] }
  },
  
  // ============================================
  // RUTA WILDCARD - MANEJO DE 404
  // ============================================
  { 
    path: '**', 
    redirectTo: '/login' 
  }
];