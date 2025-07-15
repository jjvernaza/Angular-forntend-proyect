import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-eliminar-cliente-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eliminar-cliente-modal.component.html',
  styleUrls: ['./eliminar-cliente-modal.component.css']
})
export class EliminarClienteModalComponent implements OnInit {
  @Input() mostrarModal: boolean = false;
  @Input() clienteId!: number;
  @Input() nombreCliente: string = '';
  
  @Output() cerrarModal = new EventEmitter<void>();
  @Output() confirmarEliminacion = new EventEmitter<number>();
  
  constructor() {}
  
  ngOnInit(): void {
    // Añadir event listener para cerrar el modal con la tecla Escape
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  ngOnDestroy(): void {
    // Remover event listener al destruir el componente
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  private handleKeyDown(event: KeyboardEvent): void {
    if (this.mostrarModal && event.key === 'Escape') {
      this.cerrar();
    }
  }
  
  cerrar() {
    this.cerrarModal.emit();
  }
  
  eliminar() {
    this.confirmarEliminacion.emit(this.clienteId);
  }
}