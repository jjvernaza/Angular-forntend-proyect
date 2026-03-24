// src/app/sidebar/sidebar.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  userName: string = '';
  userPermissions: string[] = [];
  sidebarAbierto: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.userName = `${currentUser.nombre} ${currentUser.apellidos || ''}`.trim();
      this.userPermissions = this.authService.getUserPermissions();

      console.log('👤 Usuario en sidebar:', this.userName);
      console.log('🔐 Permisos en sidebar:', this.userPermissions);
      console.log('📊 Total permisos:', this.userPermissions.length);

      this.cdr.detectChanges();
    }
  }

  toggleSidebar(): void {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  cerrarSidebar(): void {
    this.sidebarAbierto = false;
  }

  onNavClick(event: Event, permisos: string[]): void {
    this.verificarPermiso(event, permisos);
    if (window.innerWidth < 768) {
      this.cerrarSidebar();
    }
  }

  cerrarSesion(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
    }
  }

  tienePermiso(permiso: string): boolean {
    return this.authService.hasPermission(permiso);
  }

  tieneAlgunoDeEstosPermisos(permisos: string[]): boolean {
    return this.authService.hasAnyPermission(permisos);
  }

  verificarPermiso(event: Event, permisos: string[]): void {
    if (!this.tieneAlgunoDeEstosPermisos(permisos)) {
      event.preventDefault();
      alert('No tienes permisos para acceder a esta sección.');
    }
  }
}