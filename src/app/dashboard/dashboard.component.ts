import { Component, OnInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Chart, ChartType } from 'chart.js/auto';
import { ApiService } from '../services/api.service';
import { Subscription } from 'rxjs';

interface MonthlyIncomeItem {
  mes: string;
  anio: number;
  total: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Define los gráficos con tipo 'any' para evitar problemas de tipado
  public clientChart: any = null;
  public incomeChart: any = null;
  public serviceChart: any = null;
  public sectorChart: any = null;
  
  // Datos para gráficos y tabla
  public dashboardStats: any = null;
  public monthlyIncomeData: MonthlyIncomeItem[] = [];
  
  // Selectores de año
  public availableYears: number[] = [2024, 2025];
  public selectedYear: number = new Date().getFullYear();
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDashboardData();
    }
  }

  ngOnDestroy(): void {
    // Limpiar todas las suscripciones al destruir el componente
    this.subscriptions.unsubscribe();
    
    // Destruir los gráficos para evitar memory leaks
    if (this.clientChart) this.clientChart.destroy();
    if (this.incomeChart) this.incomeChart.destroy();
    if (this.serviceChart) this.serviceChart.destroy();
    if (this.sectorChart) this.sectorChart.destroy();
  }

  loadDashboardData(): void {
    // Cargar estadísticas generales del dashboard
    const statsSub = this.apiService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.dashboardStats = data;
        console.log('Dashboard stats:', data);
        
        // Inicializar gráficos de clientes, tipos de servicio y sectores
        setTimeout(() => {
          this.initializeClientChart();
          this.initializeServiceChart();
          this.initializeSectorChart();
        }, 300);
      },
      error: (error: any) => {
        console.error('Error al cargar estadísticas del dashboard:', error);
      }
    });
    
    this.subscriptions.add(statsSub);
    
    // Cargar datos de ingresos mensuales por año seleccionado
    this.loadIncomeDataByYear(this.selectedYear);
  }
  
  loadIncomeDataByYear(year: number): void {
    this.selectedYear = year;
    
    // Limpiar gráfico anterior si existe
    if (this.incomeChart) {
      this.incomeChart.destroy();
      this.incomeChart = null;
    }
    
    // Usar el método específico para cargar ingresos por año
    const incomeSub = this.apiService.getMonthlyIncome(year).subscribe({
      next: (data: any[]) => {
        console.log(`Ingresos mensuales para ${year}:`, data);
        
        // Procesar datos para gráfico y tabla
        this.monthlyIncomeData = data.map((item: any) => ({
          mes: this.formatMonth(item.Mes),
          anio: item.anio,
          total: parseFloat(item.total || 0)
        }));
        
        // Inicializar gráfico de ingresos
        setTimeout(() => {
          this.initializeIncomeChart();
        }, 300);
      },
      error: (error: any) => {
        console.error(`Error al cargar ingresos para el año ${year}:`, error);
        // En caso de error, usar datos de ejemplo
        this.monthlyIncomeData = this.generateSampleMonthlyData(year);
        setTimeout(() => {
          this.initializeIncomeChart();
        }, 300);
      }
    });
    
    this.subscriptions.add(incomeSub);
  }

  initializeClientChart(): void {
    const clientChartCanvas = document.getElementById('clientChartCanvas') as HTMLCanvasElement;
    if (!clientChartCanvas) return;
    
    // Crear datos por defecto si no hay datos disponibles
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
            backgroundColor: ['#2196F3', '#FFC107', '#F44336']
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
    
    // Asegurarse de que hay datos, o usar datos vacíos
    let meses = [];
    let montos = [];
    
    if (this.monthlyIncomeData && this.monthlyIncomeData.length > 0) {
      meses = this.monthlyIncomeData.map(item => item.mes);
      montos = this.monthlyIncomeData.map(item => item.total);
    } else {
      const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      meses = monthNames;
      montos = Array(12).fill(0);
    }

    this.incomeChart = new Chart(incomeChartCanvas, {
      type: 'bar' as ChartType,
      data: {
        labels: meses,
        datasets: [
          {
            label: 'Ingresos por mes',
            data: montos,
            backgroundColor: '#2196F3'
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
            display: false
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
    
    // Datos por defecto si no hay datos disponibles
    let tiposServicio = ['Sin datos'];
    let cantidadPorServicio = [1];
    
    // Usar datos reales si están disponibles
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
    
    // Datos por defecto si no hay datos disponibles
    let nombresSectores = ['Sin datos'];
    let cantidadPorSector = [0];
    
    // Usar datos reales si están disponibles
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

  // Generar datos de ejemplo para meses
  generateSampleMonthlyData(year: number): MonthlyIncomeItem[] {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return monthNames.map((mes, index) => ({
      mes: mes,
      anio: year,
      total: Math.floor(Math.random() * 5000) + 500
    }));
  }

  // Método para manejar la descarga de datos de ingresos (CSV)
  downloadData(): void {
    if (!this.monthlyIncomeData.length) {
      alert('No hay datos disponibles para descargar');
      return;
    }
    
    try {
      // Crear contenido CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Mes,Año,Ingresos\n";
      
      this.monthlyIncomeData.forEach(item => {
        csvContent += `${item.mes},${item.anio},${item.total}\n`;
      });
      
      // Crear elemento de enlace para descargar
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ingresos_mensuales_${this.selectedYear}.csv`);
      document.body.appendChild(link);
      
      // Descargar el archivo
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar datos:', error);
      alert('Error al generar la descarga');
    }
  }

  // Método para descargar Excel de todos los clientes
  downloadClientsExcel(): void {
    console.log('Iniciando descarga de Excel...');
    
    const excelSub = this.apiService.exportClientsToExcel().subscribe({
      next: (blob: Blob) => {
        console.log('Excel recibido, creando descarga...');
        
        // Crear URL del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear elemento de enlace para descarga
        const link = document.createElement('a');
        link.href = url;
        
        // Generar nombre del archivo con fecha actual
        const fechaActual = new Date().toISOString().split('T')[0];
        link.download = `clientes_vozipcompany_${fechaActual}.xlsx`;
        
        // Agregar al DOM, hacer clic y limpiar
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL del objeto
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga de Excel completada');
      },
      error: (error: any) => {
        console.error('❌ Error al descargar Excel:', error);
        alert('Error al generar el archivo Excel. Por favor, intenta nuevamente.');
      }
    });
    
    this.subscriptions.add(excelSub);
  }
  
  // Cambiar el año seleccionado
  changeYear(year: number): void {
    if (this.selectedYear !== year) {
      this.loadIncomeDataByYear(year);
    }
  }
  
  // Formatear el nombre del mes (de uppercase a formato título)
  formatMonth(mesUpperCase: string): string {
    if (!mesUpperCase) return '';
    
    const monthNames: { [key: string]: string } = {
      'JANUARY': 'Enero',
      'FEBRUARY': 'Febrero',
      'MARCH': 'Marzo',
      'APRIL': 'Abril',
      'MAY': 'Mayo',
      'JUNE': 'Junio',
      'JULY': 'Julio',
      'AUGUST': 'Agosto',
      'SEPTEMBER': 'Septiembre',
      'OCTOBER': 'Octubre',
      'NOVEMBER': 'Noviembre',
      'DECEMBER': 'Diciembre'
    };
    
    return monthNames[mesUpperCase] || mesUpperCase.charAt(0) + mesUpperCase.slice(1).toLowerCase();
  }
  
  // Formatear montos para mostrarlos en la tabla
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }
}