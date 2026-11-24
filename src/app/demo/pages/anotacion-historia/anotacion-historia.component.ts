import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AnotacionHistoria } from '../../../models/anotacion-historia';
import { AnotacionHistoriaService } from '../../../services/anotacion-historia.service';
import { mensajeError, soloFecha, soloHora, TablaDatos } from '../../../utils/tabla-datos';

/**
 * Consulta general de anotaciones de historias clínicas: DataTable con búsqueda, rango de fechas
 * (consultado en el backend), ordenamiento, paginación y detalle. Las anotaciones se crean y editan
 * desde el botón "Ver" de cada historia clínica.
 */
@Component({
  selector: 'app-anotacion-historia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './anotacion-historia.component.html',
  styleUrls: ['./anotacion-historia.component.scss']
})
export class AnotacionHistoriaComponent implements OnInit {
  /** Ruta del recurso en la API del backend. */
  private readonly api = inject(AnotacionHistoriaService);
  /** Solo fecha. */
  readonly soloFecha = soloFecha;
  /** Solo hora. */
  readonly soloHora = soloHora;

  /** DataTable de anotaciones, de la más reciente a la más antigua. */
  readonly tabla = new TablaDatos<AnotacionHistoria>(
    ['id', 'historiaId', 'veterinario', 'descripcion', 'observacion', 'diagnostico'], 'fecha', 'desc');

  /** Fecha inicio. */
  fechaInicio = '';
  /** Fecha fin. */
  fechaFin = '';
  /** Seleccionada. */
  seleccionada: AnotacionHistoria | null = null;
  /** Indica si se está cargando. */
  cargando = false;
  /** Mensaje mostrado al usuario (error). */
  error = '';

  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit(): void {
    this.cargar();
  }

  /** Consulta las anotaciones del rango de fechas seleccionado. */
  cargar(): void {
    if (this.fechaInicio && this.fechaFin && this.fechaFin < this.fechaInicio) {
      this.error = 'La fecha final no puede ser anterior a la fecha inicial.';
      return;
    }
    this.cargando = true;
    this.error = '';
    this.api.listarAnotaciones(this.fechaInicio, this.fechaFin)
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: datos => (this.tabla.datos = datos),
        error: e => (this.error = mensajeError(e, 'No fue posible cargar las anotaciones.'))
      });
  }

  /** Limpia los datos de la pantalla. */
  limpiar(): void {
    this.fechaInicio = '';
    this.fechaFin = '';
    this.tabla.busqueda = '';
    this.tabla.reiniciar();
    this.cargar();
  }
}
