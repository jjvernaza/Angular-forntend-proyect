import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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

// ✅ Importaciones de los NUEVOS componentes
import { TiposServicioComponent } from './tipos-servicio/tipos-servicio.component';
import { EstadosComponent } from './estados/estados.component';

import { AuthGuard } from './auth.guard';

export const routes: Routes = [
  // Ruta raíz - redirecciona al login
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  
  // Ruta de login
  { path: 'login', component: LoginComponent },
  
  // Rutas protegidas con AuthGuard
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'crear-usuario', component: CrearUsuarioComponent, canActivate: [AuthGuard] },
  { path: 'buscar-cliente', component: BuscarClienteComponent, canActivate: [AuthGuard] },
  { path: 'agregar-cliente', component: AgregarClienteComponent, canActivate: [AuthGuard] },
  { path: 'morosos', component: MorososComponent, canActivate: [AuthGuard] },
  { path: 'agregar-pago', component: AgregarPagoComponent, canActivate: [AuthGuard] },
  
  // Rutas de administración
  { path: 'planes', component: PlanesComponent, canActivate: [AuthGuard] },
  { path: 'sectores', component: SectoresComponent, canActivate: [AuthGuard] },
  { path: 'tarifas', component: TarifasComponent, canActivate: [AuthGuard] },
  { path: 'permisos', component: PermisosComponent, canActivate: [AuthGuard] },
  { path: 'tipos-servicio', component: TiposServicioComponent, canActivate: [AuthGuard] },
  { path: 'estados', component: EstadosComponent, canActivate: [AuthGuard] },
  
  // Ruta para cualquier ruta no definida anteriormente - redirecciona al login
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}