import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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
  
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Verificar la autenticación al cargar el componente
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    }
  }
  
  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
  // Este método se puede usar para mostrar/ocultar elementos según los permisos
  tienePermiso(permiso: string): boolean {
    return this.authService.hasPermission(permiso);
  }
}