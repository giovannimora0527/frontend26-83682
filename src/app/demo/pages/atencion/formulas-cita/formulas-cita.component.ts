import { Component, DestroyRef, inject, input, OnInit, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { FormulaService } from '../../formula-medica/service/formula.service';
import { VistaFormulaComponent } from '../../formula-medica/vista-formula/vista-formula.component';
import { FormulaMedica } from 'src/app/models/formula-medica';
import { RespuestaApi } from 'src/app/models/respuesta';
import { BotonDescargaComponent } from 'src/app/shared/components/boton-descarga/boton-descarga.component';
import { mensajeError } from 'src/app/shared/utils/http.util';
import { EditorFormulaComponent } from '../editor-formula/editor-formula.component';

/** Fórmulas de una cita: lista, edición de borradores, confirmación y anulación. */
@Component({
  selector: 'app-formulas-cita',
  imports: [VistaFormulaComponent, BotonDescargaComponent, EditorFormulaComponent],
  templateUrl: './formulas-cita.component.html'
})
export class FormulasCitaComponent implements OnInit {
  readonly citaId = input.required<number>();
  /** Durante la atención o el mismo día en que se finalizó. */
  readonly puedeFormular = input.required<boolean>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly formulaService = inject(FormulaService);
  private readonly editor = viewChild(EditorFormulaComponent);

  readonly formulas = signal<FormulaMedica[]>([]);
  readonly cargando = signal(false);
  readonly error = signal('');
  /** undefined: editor cerrado; null: fórmula nueva. */
  readonly editando = signal<FormulaMedica | null | undefined>(undefined);
  readonly procesando = signal(false);

  ngOnInit(): void {
    this.listar();
  }

  get hayBorradores(): boolean {
    return this.formulas().some(({ estadoFormula }) => estadoFormula === 'BORRADOR');
  }

  get hayCambiosSinGuardar(): boolean {
    return !!this.editor()?.form.dirty;
  }

  puedeAnular(formula: FormulaMedica): boolean {
    return formula.estadoFormula !== 'ANULADA' && formula.detalles.every(({ cantidadDespachada }) => cantidadDespachada === 0);
  }

  listar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.formulaService.listarPorCita(this.citaId()).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando.set(false))
    ).subscribe({
      next: (formulas) => this.formulas.set(formulas),
      error: (error) => this.error.set(mensajeError(error, 'No fue posible cargar las fórmulas.'))
    });
  }

  async cerrarEditor(): Promise<void> {
    if (this.hayCambiosSinGuardar) {
      const { isConfirmed } = await Swal.fire({
        title: '¿Descartar los cambios?', text: 'La fórmula tiene cambios sin guardar.', icon: 'warning', showCancelButton: true,
        confirmButtonText: 'Descartar', cancelButtonText: 'Seguir editando'
      });
      if (!isConfirmed) {
        return;
      }
    }
    this.editando.set(undefined);
  }

  alGuardar(mensaje: string): void {
    this.editando.set(undefined);
    this.listar();
    void Swal.fire('Operación exitosa', mensaje, 'success');
  }

  async confirmar(formula: FormulaMedica): Promise<void> {
    if (this.procesando()) {
      return;
    }
    this.procesando.set(true);
    const { isConfirmed } = await Swal.fire({
      title: '¿Confirmar la fórmula?', text: 'Una vez confirmada no se puede modificar y pasará a despacho.', icon: 'warning',
      showCancelButton: true, confirmButtonText: 'Confirmar', cancelButtonText: 'Cancelar'
    });
    this.terminar(isConfirmed ? this.formulaService.confirmar(formula.id) : null);
  }

  async anular(formula: FormulaMedica): Promise<void> {
    if (this.procesando()) {
      return;
    }
    this.procesando.set(true);
    const { isConfirmed, value } = await Swal.fire({
      title: '¿Anular la fórmula?', text: 'No se puede deshacer.', icon: 'warning', input: 'textarea', inputLabel: 'Motivo de la anulación',
      inputAttributes: { maxlength: '255' }, inputValidator: (motivo) => (motivo.trim() ? null : 'Escribe el motivo.'),
      showCancelButton: true, confirmButtonText: 'Anular', cancelButtonText: 'Cancelar'
    });
    this.terminar(isConfirmed ? this.formulaService.anular(formula.id, String(value).trim()) : null);
  }

  private terminar(solicitud: Observable<RespuestaApi<FormulaMedica>> | null): void {
    if (!solicitud) {
      this.procesando.set(false);
      return;
    }
    solicitud.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.procesando.set(false))
    ).subscribe({
      next: ({ message }) => {
        this.listar();
        void Swal.fire('Operación exitosa', message, 'success');
      },
      error: (error) => void Swal.fire('No se pudo completar', mensajeError(error, 'Intenta nuevamente.'), 'error')
    });
  }
}
