import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, ChartType } from 'chart.js/auto';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

interface MonthlyIncomeItem {
  mes: string;
  anio: number;
  total: number;
}

interface ExpectedIncomeItem {
  mes: string;
  anio: number;
  totalEsperado: number;
  cantidadClientes: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public clientChart: any = null;
  public incomeChart: any = null;
  public serviceChart: any = null;
  public sectorChart: any = null;
  
  public dashboardStats: any = null;
  public monthlyIncomeData: MonthlyIncomeItem[] = [];
  public expectedIncomeData: ExpectedIncomeItem[] = [];
  
  public availableYears: number[] = [2024, 2025];
  public selectedYear: number = new Date().getFullYear();
  
  private subscriptions: Subscription = new Subscription();

  private monthNamesES: { [key: string]: string } = {
    'ENERO': 'Enero',
    'FEBRERO': 'Febrero',
    'MARZO': 'Marzo',
    'ABRIL': 'Abril',
    'MAYO': 'Mayo',
    'JUNIO': 'Junio',
    'JULIO': 'Julio',
    'AGOSTO': 'Agosto',
    'SEPTIEMBRE': 'Septiembre',
    'OCTUBRE': 'Octubre',
    'NOVIEMBRE': 'Noviembre',
    'DICIEMBRE': 'Diciembre'
  };

  // ✅ Variable de permisos
  tienePermiso: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ Verificar permisos
    this.verificarPermisos();

    if (isPlatformBrowser(this.platformId)) {
      // ✅ Solo cargar si tiene permisos
      if (this.tienePermiso) {
        this.loadDashboardData();
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    
    if (this.clientChart) this.clientChart.destroy();
    if (this.incomeChart) this.incomeChart.destroy();
    if (this.serviceChart) this.serviceChart.destroy();
    if (this.sectorChart) this.sectorChart.destroy();
  }

  private verificarPermisos(): void {
    this.tienePermiso = this.authService.hasPermission('dashboard.ver');
    
    console.log('🔐 Permisos en dashboard:');
    console.log('   Ver dashboard:', this.tienePermiso);
    console.log('   Permisos del usuario:', this.authService.getUserPermissions());
  }

  loadDashboardData(): void {
    if (!this.tienePermiso) {
      console.log('❌ Sin permisos para cargar dashboard');
      return;
    }

    const statsSub = this.apiService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.dashboardStats = data;
        console.log('✅ Dashboard stats cargados:', data);
        
        if (data.pagos?.ultimosDosMeses) {
          this.monthlyIncomeData = data.pagos.ultimosDosMeses.map((item: any) => ({
            mes: this.formatMonth(item.mes),
            anio: item.anio,
            total: parseFloat(item.total || 0)
          }));
        }
        
        if (data.pagos?.esperados) {
          this.expectedIncomeData = data.pagos.esperados.map((item: any) => ({
            mes: this.formatMonth(item.mes),
            anio: item.anio,
            totalEsperado: parseFloat(item.totalEsperado || 0),
            cantidadClientes: item.cantidadClientes || 0
          }));
        }
        
        setTimeout(() => {
          this.initializeClientChart();
          this.initializeServiceChart();
          this.initializeSectorChart();
          this.initializeIncomeChart();
        }, 300);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar estadísticas del dashboard:', error);
      }
    });
    
    this.subscriptions.add(statsSub);
  }

  initializeClientChart(): void {
    const clientChartCanvas = document.getElementById('clientChartCanvas') as HTMLCanvasElement;
    if (!clientChartCanvas) return;
    
    const clientData = this.dashboardStats?.clientes || { total: 0, activos: 0, suspendidos: 0, retirados: 0 };
    
    this.clientChart = new Chart(clientChartCanvas, {
      type: 'pie' as ChartType,
      data: {
        labels: ['Activos', 'Suspendidos', 'Retirados'],
        datasets: [
          {
            label: 'Clientes',
            data: [
              clientData.activos || 0, 
              clientData.suspendidos || 0, 
              clientData.retirados || 0
            ],
            backgroundColor: ['#22c55e', '#ff8800', '#c42121']
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución de Clientes por Estado'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  initializeIncomeChart(): void {
    const incomeChartCanvas = document.getElementById('incomeChartCanvas') as HTMLCanvasElement;
    if (!incomeChartCanvas) return;
    
    let meses: string[] = [];
    let ingresosReales: number[] = [];
    let ingresosEsperados: number[] = [];
    
    if (this.monthlyIncomeData && this.monthlyIncomeData.length > 0) {
      meses = this.monthlyIncomeData.map((item: MonthlyIncomeItem) => item.mes);
      ingresosReales = this.monthlyIncomeData.map((item: MonthlyIncomeItem) => item.total);
      ingresosEsperados = this.expectedIncomeData.map((item: ExpectedIncomeItem) => item.totalEsperado);
    } else {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      meses = monthNames;
      ingresosReales = Array(12).fill(0);
      ingresosEsperados = Array(12).fill(0);
    }

    this.incomeChart = new Chart(incomeChartCanvas, {
      type: 'bar' as ChartType,
      data: {
        labels: meses,
        datasets: [
          {
            label: 'Ingresos Reales',
            data: ingresosReales,
            backgroundColor: '#2196F3'
          },
          {
            label: 'Ingresos Esperados',
            data: ingresosEsperados,
            backgroundColor: '#4CAF50'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Ingresos Mensuales ${this.selectedYear}`
          },
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Monto ($)'
            }
          }
        }
      }
    });
  }
  
  initializeServiceChart(): void {
    const serviceChartCanvas = document.getElementById('serviceChartCanvas') as HTMLCanvasElement;
    if (!serviceChartCanvas) return;
    
    let tiposServicio = ['Sin datos'];
    let cantidadPorServicio = [1];
    
    if (this.dashboardStats?.servicios && this.dashboardStats.servicios.length > 0) {
      tiposServicio = this.dashboardStats.servicios.map((s: any) => s.tipo);
      cantidadPorServicio = this.dashboardStats.servicios.map((s: any) => s.cantidad);
    }
    
    this.serviceChart = new Chart(serviceChartCanvas, {
      type: 'doughnut' as ChartType,
      data: {
        labels: tiposServicio,
        datasets: [
          {
            label: 'Clientes por Tipo de Servicio',
            data: cantidadPorServicio,
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
            ]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución por Tipo de Servicio'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
  
  initializeSectorChart(): void {
    const sectorChartCanvas = document.getElementById('sectorChartCanvas') as HTMLCanvasElement;
    if (!sectorChartCanvas) return;
    
    let nombresSectores = ['Sin datos'];
    let cantidadPorSector = [0];
    
    if (this.dashboardStats?.sectores && this.dashboardStats.sectores.length > 0) {
      nombresSectores = this.dashboardStats.sectores.map((s: any) => s.sector || 'Sin nombre');
      cantidadPorSector = this.dashboardStats.sectores.map((s: any) => s.cantidad || 0);
    }
    
    this.sectorChart = new Chart(sectorChartCanvas, {
      type: 'bar' as ChartType,
      data: {
        labels: nombresSectores,
        datasets: [
          {
            label: 'Clientes por Sector',
            data: cantidadPorSector,
            backgroundColor: '#4CAF50'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución por Sector'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Cantidad de Clientes'
            }
          }
        }
      }
    });
  }

  downloadData(): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para descargar datos.');
      return;
    }

    if (!this.monthlyIncomeData.length) {
      alert('No hay datos disponibles para descargar');
      return;
    }
    
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Mes,Año,Ingresos Reales,Ingresos Esperados\n";
      
      for (let i = 0; i < this.monthlyIncomeData.length; i++) {
        const item = this.monthlyIncomeData[i];
        const esperadoItem = this.expectedIncomeData[i];
        const esperado = esperadoItem ? esperadoItem.totalEsperado : 0;
        csvContent += `${item.mes},${item.anio},${item.total},${esperado}\n`;
      }
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ingresos_mensuales_${this.selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ CSV descargado');
    } catch (error) {
      console.error('❌ Error al descargar datos:', error);
      alert('Error al generar la descarga');
    }
  }

  downloadClientsExcel(): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para descargar reportes.');
      return;
    }

    console.log('📥 Iniciando descarga de Excel...');
    
    const excelSub = this.apiService.exportClientsToExcel().subscribe({
      next: (blob: Blob) => {
        console.log('✅ Excel recibido, creando descarga...');
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const fechaActual = new Date().toISOString().split('T')[0];
        link.download = `clientes_vozipcompany_${fechaActual}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga completada');
      },
      error: (error: any) => {
        console.error('❌ Error al descargar Excel:', error);
        alert('Error al generar el archivo Excel. Por favor, intenta nuevamente.');
      }
    });
    
    this.subscriptions.add(excelSub);
  }

  downloadReporteClientesPagos(): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para descargar reportes.');
      return;
    }

    console.log(`📥 Descargando reporte de pagos del año ${this.selectedYear}...`);
    
    const reportSub = this.apiService.exportClientesPagosExcel(this.selectedYear).subscribe({
      next: (blob: Blob) => {
        console.log('✅ Excel recibido, creando descarga...');
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reporte_clientes_pagos_${this.selectedYear}.xlsx`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga completada');
      },
      error: (error: any) => {
        console.error('❌ Error al descargar reporte:', error);
        alert('Error al generar el reporte. Por favor, intenta nuevamente.');
      }
    });
    
    this.subscriptions.add(reportSub);
  }
  
  changeYear(year: number): void {
    if (!this.tienePermiso) {
      alert('No tienes permisos para cambiar el año.');
      return;
    }

    if (this.selectedYear !== year) {
      this.selectedYear = year;
      this.loadDashboardData();
    }
  }
  
  formatMonth(mesUpperCase: string): string {
    if (!mesUpperCase) return '';
    return this.monthNamesES[mesUpperCase] || mesUpperCase.charAt(0) + mesUpperCase.slice(1).toLowerCase();
  }
  
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  getEstadoCount(estadoNombre: string): number {
    if (!this.dashboardStats?.debug?.estadosEncontrados) {
      return 0;
    }
    
    const estado = this.dashboardStats.debug.estadosEncontrados.find(
      (e: any) => e.nombre?.toLowerCase() === estadoNombre.toLowerCase()
    );
    
    return estado ? estado.cantidad : 0;
  }
  
  getExpectedIncomeForIndex(index: number): number {
    if (this.expectedIncomeData && this.expectedIncomeData[index]) {
      return this.expectedIncomeData[index].totalEsperado || 0;
    }
    return 0;
  }
  
  getDiferencia(mes: string): number {
    const real = this.monthlyIncomeData.find((item: MonthlyIncomeItem) => item.mes === mes);
    const esperado = this.expectedIncomeData.find((item: ExpectedIncomeItem) => item.mes === mes);
    
    if (!real || !esperado) return 0;
    
    return real.total - esperado.totalEsperado;
  }
  
  getPorcentajeCumplimiento(mes: string): number {
    const real = this.monthlyIncomeData.find((item: MonthlyIncomeItem) => item.mes === mes);
    const esperado = this.expectedIncomeData.find((item: ExpectedIncomeItem) => item.mes === mes);
    
    if (!real || !esperado || esperado.totalEsperado === 0) return 0;
    
    return (real.total / esperado.totalEsperado) * 100;
  }
}