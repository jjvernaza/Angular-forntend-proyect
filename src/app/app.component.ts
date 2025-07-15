import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'dashboard-proyecto';

  isAuthenticated = false;

  constructor(private router: Router) {
    // Revisar el estado de autenticación en cada cambio de ruta
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isAuthenticated = event.url !== '/';
      }
    });
  }
}
