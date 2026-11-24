import { Component, DestroyRef, inject, TemplateRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { EstadoFormula } from 'src/app/models/estados';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { BadgeEstadoComponent } from 'src/app/shared/components/badge-estado/badge-estado.component';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { BotonOrdenComponent } from 'src/app/shared/components/boton-orden/boton-orden.component';
import { FiltroFechasComponent } from 'src/app/shared/components/filtro-fechas/filtro-fechas.component';
import { PaginacionComponent } from 'src/app/shared/components/paginacion/paginacion.component';
import { ESTADOS_UI } from 'src/app/shared/estados-ui';
import { FechaHoraPipe } from 'src/app/shared/pipes/formato.pipes';
import { RangoFechas } from 'src/app/shared/utils/fecha.util';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { Tabla } from 'src/app/shared/utils/tabla.util';
import { FiltroFormulas, FormulaService } from './service/formula.service';
import { VistaFormulaComponent } from './vista-formula/vista-formula.component';

/** Consulta de fórmulas: se crean dentro de la atención médica. */
@Component({
  selector: 'app-formula-medica',
  imports: [
    FormsModule, BadgeEstadoComponent, BotonDescargaComponent, BotonOrdenComponent, FiltroFechasComponent, PaginacionComponent, FechaHoraPipe,
    VistaFormulaComponent
  ],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalService = inject(NgbModal);
  private readonly formulaService = inject(FormulaService);
  private consulta?: Subscription;
  private modal?: NgbModalRef;

  readonly estados: EstadoFormula[] = ['BORRADOR', 'CONFIRMADA', 'ANULADA'];
  readonly estadosUi = ESTADOS_UI;
  readonly columnas = [
    { clave: 'numero', titulo: 'Número' }, { clave: 'fecha', titulo: 'Fecha' }, { clave: 'mascota', titulo: 'Mascota' },
    { clave: 'propietario', titulo: 'Propietario' }, { clave: 'medico', titulo: 'Médico' }, { clave: 'estado', titulo: 'Estado' },
    { clave: 'despacho', titulo: 'Despacho' }, { clave: 'medicamentos', titulo: 'Medicamentos' }
  ];
  readonly tabla = new Tabla<FormulaMedica>(
    {
      numero: (f) => f.numero,
      fecha: (f) => f.fecha,
      mascota: (f) => f.mascotaNombre,
      propietario: (f) => f.clienteNombre,
      medico: (f) => f.medicoNombre,
      estado: (f) => ESTADOS_UI[f.estadoFormula].etiqueta,
      despacho: (f) => (f.estadoDespacho ? ESTADOS_UI[f.estadoDespacho].etiqueta : ''),
      medicamentos: (f) => f.detalles.length,
      // Solo para la búsqueda: medicamentos e indicaciones.
      contenido: (f) => [f.indicacionesGenerales, ...f.detalles.flatMap((d) => [d.medicamentoNombre, d.medicamentoCodigo, d.indicaciones])].join(' ')
    },
    'fecha'
  );

  filtro: FiltroFormulas = { desde: '', hasta: '', estado: '' };
  cargando = false;
  errorListado = '';
  seleccionada: FormulaMedica | null = null;

  constructor() {
    this.tabla.direccion = 'desc';
    this.destroyRef.onDestroy(() => this.modal?.dismiss());
    this.listar();
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
    this.errorListado = '';
    this.consulta = this.formulaService.listar(this.filtro).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (formulas) => {
        this.tabla.items = formulas;
        this.cargando = false;
      },
      error: (error) => {
        this.errorListado = mensajeError(error, 'No fue posible cargar las fórmulas.');
        this.cargando = false;
      }
    });
  }

  ver(formula: FormulaMedica, contenido: TemplateRef<unknown>): void {
    this.seleccionada = formula;
    this.modal = this.modalService.open(contenido, { size: 'xl', scrollable: true, ariaLabelledBy: 'formulaTitulo' });
  }
}
