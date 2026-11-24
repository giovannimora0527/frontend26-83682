import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, interval, Subject, Subscription } from 'rxjs';
import { FormulaPendiente } from 'src/app/models/despacho';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { ESTADOS_PENDIENTES, SIN_FILTRO } from '../despacho.util';
import { DespachoService, FiltroDespacho } from '../service/despacho.service';

const REFRESCO_MS = 60_000;

@Component({
  selector: 'app-bandeja',
  imports: [FormsModule, RouterLink, BadgeEstadoComponent, BotonOrdenComponent, FiltroFechasComponent, PaginacionComponent, FechaHoraPipe],
  templateUrl: './bandeja.component.html'
})
export class BandejaComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly despachoService = inject(DespachoService);
  private readonly busqueda = new Subject<void>();
  private consulta?: Subscription;

  readonly estados = ESTADOS_PENDIENTES;
  readonly estadosUi = ESTADOS_UI;
  readonly columnas = [
    { clave: 'numero', titulo: 'Fórmula' }, { clave: 'fecha', titulo: 'Fecha' }, { clave: 'medico', titulo: 'Médico' }, { clave: 'propietario', titulo: 'Propietario' },
    { clave: 'mascota', titulo: 'Mascota' }, { clave: 'medicamentos', titulo: 'Medicamentos' }, { clave: 'estado', titulo: 'Estado' }
  ];
  readonly tabla = new Tabla<FormulaPendiente>(
    {
      numero: (f) => f.numero, fecha: (f) => f.fecha, medico: (f) => f.medicoNombre, propietario: (f) => f.clienteNombre, mascota: (f) => f.mascotaNombre,
      medicamentos: (f) => f.totalMedicamentos, estado: (f) => ESTADOS_UI[f.estadoDespacho].etiqueta
    },
    'fecha'
  );
  filtro: FiltroDespacho = { ...SIN_FILTRO };
  cargando = false;
  error = '';
  actualizado: Date | null = null;

  constructor() {
    this.tabla.direccion = 'desc';
    this.busqueda.pipe(debounceTime(400), takeUntilDestroyed()).subscribe(() => this.listar());
    interval(REFRESCO_MS).pipe(takeUntilDestroyed()).subscribe(() => this.listar());
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

  /** Conserva la lista y la página mientras refresca. */
  listar(): void {
    this.consulta?.unsubscribe();
    this.cargando = true;
    this.consulta = this.despachoService.listarPendientes(this.filtro).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (formulas) => {
        this.error = '';
        this.tabla.items = formulas;
        this.actualizado = new Date();
        this.cargando = false;
      },
      error: (error) => {
        this.error = mensajeError(error, 'No fue posible cargar las fórmulas pendientes.');
        this.cargando = false;
      }
    });
  }
}
