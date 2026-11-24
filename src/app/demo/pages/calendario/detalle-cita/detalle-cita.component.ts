import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize, forkJoin, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { esEditable } from '../../cita/cita.util';
import { HistorialCitaComponent } from '../../cita/historial-cita/historial-cita.component';
import { CitaService } from '../../cita/service/cita.service';
import { AtencionCita } from 'src/app/models/atencion';
import { EventoCalendario } from 'src/app/models/evento-calendario';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { BackendService } from 'src/app/services/backend.service';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { fechaHoraIso } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { environment } from 'src/environments/environment';

/** Detalle de un evento del calendario con las acciones de su estado. Se cierra con true si hubo cambios. */
@Component({
  selector: 'app-detalle-cita',
  imports: [FormsModule, BadgeEstadoComponent, BotonDescargaComponent, FechaHoraPipe],
  templateUrl: './detalle-cita.component.html'
})
export class DetalleCitaComponent implements OnInit {
  @Input({ required: true }) evento!: EventoCalendario;

  private readonly destroyRef = inject(DestroyRef);
  private readonly citaService = inject(CitaService);
  private readonly backendService = inject(BackendService);
  private readonly modalService = inject(NgbModal);
  private readonly router = inject(Router);
  private modalHistorial?: NgbModalRef;
  readonly modal = inject(NgbActiveModal);
  readonly esEditable = esEditable;

  procesando = false;
  error = '';
  reprogramando = false;
  nuevaFecha = '';

  atencionId: number | null = null;
  formulas: FormulaMedica[] = [];
  errorDocumentos = '';

  ngOnInit(): void {
    if (this.evento.estado === 'ATENDIDA') {
      this.cargarDocumentos();
    }
  }

  confirmar(): void {
    this.enviar(this.citaService.cambiarEstado(this.evento.id, 'CONFIRMADA'));
  }

  async cancelar(): Promise<void> {
    if (this.procesando) {
      return;
    }
    this.procesando = true;
    const { isConfirmed, value } = await Swal.fire({
      title: '¿Cancelar la cita?', text: 'Una cita cancelada no se puede volver a editar.', icon: 'warning',
      input: 'textarea', inputLabel: 'Motivo de la cancelación', inputAttributes: { maxlength: '255' },
      inputValidator: (motivo) => (motivo.trim() ? null : 'Escribe el motivo de la cancelación.'),
      showCancelButton: true, confirmButtonText: 'Cancelar cita', cancelButtonText: 'Volver'
    });
    this.procesando = false;
    if (isConfirmed) {
      this.enviar(this.citaService.cambiarEstado(this.evento.id, 'CANCELADA', String(value).trim()));
    }
  }

  mostrarReprogramar(): void {
    this.reprogramando = !this.reprogramando;
    this.nuevaFecha = this.evento.start.slice(0, 16);
    this.error = '';
  }

  async reprogramar(): Promise<void> {
    if (this.procesando) {
      return;
    }
    const fecha = new Date(this.nuevaFecha);
    if (!this.nuevaFecha || Number.isNaN(fecha.getTime()) || fecha.getTime() <= Date.now()) {
      this.error = 'Selecciona una fecha y hora futuras.';
      return;
    }
    this.procesando = true;
    const { isConfirmed } = await Swal.fire({
      title: '¿Reprogramar la cita?', text: fecha.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' }), icon: 'question',
      showCancelButton: true, confirmButtonText: 'Reprogramar', cancelButtonText: 'Volver'
    });
    this.procesando = false;
    if (isConfirmed) {
      this.enviar(this.citaService.reprogramar(this.evento.id, fechaHoraIso(fecha)));
    }
  }

  /** Iniciar, continuar o ver la atención se hace en el módulo de atención. */
  irAtencion(): void {
    this.modal.close(false);
    void this.router.navigate(['/inicio/atencion', this.evento.id]);
  }

  verHistorialMascota(): void {
    this.abrirHistorial({ mascotaId: this.evento.extendedProps.mascotaId, titulo: `Historial de ${this.evento.extendedProps.mascotaNombre}` });
  }

  verHistorialEstados(): void {
    this.abrirHistorial({ citaId: this.evento.id, titulo: 'Historial de estados de la cita' });
  }

  private abrirHistorial(datos: { mascotaId?: number; citaId?: number; titulo: string }): void {
    this.modalHistorial = this.modalService.open(HistorialCitaComponent, { size: 'lg', scrollable: true, ariaLabelledBy: 'historialTitulo' });
    Object.assign(this.modalHistorial.componentInstance, datos);
  }

  private cargarDocumentos(): void {
    forkJoin({
      detalle: this.backendService.get<AtencionCita>(environment.apiUrlAuth, 'atencion', `cita/${this.evento.id}`),
      formulas: this.backendService.get<FormulaMedica[]>(environment.apiUrlAuth, 'formula-medica', `cita/${this.evento.id}`)
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ detalle, formulas }) => {
        this.atencionId = detalle.atencion?.id ?? null;
        this.formulas = formulas.filter(({ estadoFormula }) => estadoFormula === 'CONFIRMADA');
      },
      error: (error) => this.errorDocumentos = mensajeError(error, 'No fue posible cargar los documentos de la atención.')
    });
  }

  private enviar(solicitud: Observable<{ message: string }>): void {
    if (this.procesando) {
      return;
    }
    this.procesando = true;
    this.error = '';
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando = false)
    ).subscribe({
      next: ({ message }) => {
        this.modal.close(true);
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error) => this.error = mensajeError(error, 'No fue posible actualizar la cita.')
    });
  }
}
