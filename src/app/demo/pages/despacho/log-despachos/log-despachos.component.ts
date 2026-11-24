import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { debounceTime, Subject, Subscription } from 'rxjs';
import { Despacho } from 'src/app/models/despacho';
import { Estado } from 'src/app/models/estados';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { DespachoModalComponent } from '../despacho-modal/despacho-modal.component';
import { SIN_FILTRO } from '../despacho.util';
import { DespachoService, FiltroDespacho } from '../service/despacho.service';

/** Log de despachos. Lo usan el módulo de despacho y, en lectura, el inventario del ADMINISTRADOR. */
@Component({
  selector: 'app-log-despachos',
  imports: [FormsModule, BadgeEstadoComponent, BotonOrdenComponent, FiltroFechasComponent, PaginacionComponent, FechaHoraPipe],
  templateUrl: './log-despachos.component.html'
})
export class LogDespachosComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly despachoService = inject(DespachoService);
  private readonly busqueda = new Subject<void>();
  private consulta?: Subscription;
  private modal?: NgbModalRef;

  readonly estadosUi = ESTADOS_UI;
  readonly estados: Estado[] = [
    'CONFIRMADO', 'REVERTIDO', 'CANCELADO', 'DESPACHADO', 'DESPACHO_PARCIAL', 'PENDIENTE_DISPONIBILIDAD', 'PENDIENTE_DESPACHO', 'EN_PREPARACION'
  ];
  readonly columnas = [
    { clave: 'numero', titulo: 'Despacho' }, { clave: 'formula', titulo: 'Fórmula' }, { clave: 'fecha', titulo: 'Fecha y hora' }, { clave: 'mascota', titulo: 'Mascota' },
    { clave: 'propietario', titulo: 'Propietario' }, { clave: 'medico', titulo: 'Médico' }, { clave: 'usuario', titulo: 'Despachó' },
    { clave: 'medicamentos', titulo: 'Medicamentos y lotes' }, { clave: 'estado', titulo: 'Estado' }
  ];
  readonly tabla = new Tabla<Despacho>(
    {
      numero: (d) => d.numero, formula: (d) => d.formulaNumero, fecha: (d) => d.fecha, mascota: (d) => d.mascotaNombre, propietario: (d) => d.clienteNombre,
      medico: (d) => d.medicoNombre, usuario: (d) => d.usuario, medicamentos: (d) => d.items.map(({ medicamentoNombre }) => medicamentoNombre).join(', '),
      estado: (d) => d.estado
    },
    'fecha'
  );
  filtro: FiltroDespacho = { ...SIN_FILTRO };
  cargando = false;
  error = '';

  constructor() {
    this.tabla.direccion = 'desc';
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.busqueda.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => this.listar());
    this.listar();
  }

  buscar(): void {
    this.busqueda.next();
  }

  filtrarFechas(rango: RangoFechas | null): void {
    if (rango) {
      this.filtro = { ...this.filtro, ...rango };
      this.listar();
    }
  }

  listar(): void {
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.error = '';
    this.consulta = this.despachoService.historial(this.filtro).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (despachos) => {
        this.tabla.items = despachos;
        this.cargando = false;
      },
      error: (error) => {
        this.error = mensajeError(error, 'No fue posible cargar los despachos.');
        this.cargando = false;
      }
    });
  }

  ver(despacho: Despacho): void {
    this.modal = this.modalService.open(DespachoModalComponent, { size: 'lg', scrollable: true, ariaLabelledBy: 'despachoTitulo' });
    this.modal.componentInstance.despacho = despacho;
    this.modal.closed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((cambio) => {
      if (cambio) {
        this.listar();
      }
    });
  }
}
