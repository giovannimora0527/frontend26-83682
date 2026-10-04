import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Modal } from 'bootstrap';
import { FormulaMedica, FormulaMedicaPayload } from 'src/app/models/formula-medica';
import {
  FormulaMedicaService,
  MODO_DEMOSTRACION_FORMULAS
} from 'src/app/services/formula-medica.service';

type FormulaMedicaForm = FormGroup<{
  dosis: FormControl<string>;
  indicaciones: FormControl<string>;
  fechaInicio: FormControl<string>;
  fechaFin: FormControl<string>;
  medicamento: FormControl<string>;
  paciente: FormControl<string>;
  medico: FormControl<string>;
}>;

@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent implements OnInit {
  readonly modoDemostracion = MODO_DEMOSTRACION_FORMULAS;
  formulas: FormulaMedica[] = [];
  form!: FormulaMedicaForm;
  formulaSeleccionada: FormulaMedica | null = null;
  cargando = false;
  guardando = false;
  errorMensaje = '';
  modalInstance: Modal | null = null;
  modoEdicion = false;

  constructor(
    private readonly formulaMedicaService: FormulaMedicaService,
    private readonly formBuilder: NonNullableFormBuilder
  ) {
    this.inicializarFormulario();
  }

  ngOnInit(): void {
    this.listar();
  }

  /** Acceso abreviado a los controles para las validaciones del formulario. */
  get controles(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Carga los registros y comunica claramente cualquier error del backend. */
  listar(): void {
    this.cargando = true;
    this.errorMensaje = '';
    this.formulaMedicaService.listar().subscribe({
      next: (formulas) => {
        this.formulas = formulas;
        this.cargando = false;
      },
      error: (error: unknown) => {
        console.error('Error al obtener las fórmulas médicas:', error);
        this.errorMensaje = error instanceof HttpErrorResponse && error.status === 0
          ? 'No se pudo conectar con el servidor. Verifique que el backend esté iniciado y disponible.'
          : 'No fue posible cargar las fórmulas médicas. Intente nuevamente.';
        this.cargando = false;
      }
    });
  }

  /** Prepara y abre el formulario vacío para registrar una fórmula. */
  nuevaFormula(): void {
    this.formulaSeleccionada = null;
    this.modoEdicion = false;
    this.form.reset();
    this.errorMensaje = '';
    this.openModal();
  }

  /** Carga los datos de la fila elegida y abre el formulario de edición. */
  editarFormula(formula: FormulaMedica): void {
    this.formulaSeleccionada = formula;
    this.modoEdicion = true;
    this.errorMensaje = '';
    this.form.patchValue({
      dosis: formula.dosis,
      indicaciones: formula.indicaciones,
      fechaInicio: this.formatoFecha(formula.fechaInicio),
      fechaFin: this.formatoFecha(formula.fechaFin),
      medicamento: formula.medicamento,
      paciente: formula.paciente,
      medico: formula.medico
    });
    this.openModal();
  }

  /** Valida y envía los datos según el modo de creación o edición. */
  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: FormulaMedicaPayload = this.form.getRawValue();
    this.guardando = true;
    this.errorMensaje = '';
    const solicitud = this.modoEdicion && this.formulaSeleccionada?.id != null
      ? this.formulaMedicaService.actualizar(this.formulaSeleccionada.id, payload)
      : this.formulaMedicaService.crear(payload);

    solicitud.subscribe({
      next: () => {
        this.guardando = false;
        this.closeModal();
        this.listar();
      },
      error: (error: unknown) => {
        console.error('Error al guardar la fórmula médica:', error);
        this.errorMensaje = error instanceof HttpErrorResponse && error.status === 0
          ? 'No se pudo guardar: no hay conexión con el servidor. Inicie el backend y vuelva a intentarlo.'
          : 'No fue posible guardar la fórmula médica. Verifique los datos e intente nuevamente.';
        this.guardando = false;
      }
    });
  }

  /** Inicializa los campos requeridos por la pantalla de creación/edición. */
  private inicializarFormulario(): void {
    this.form = this.formBuilder.group({
      dosis: ['', Validators.required],
      indicaciones: ['', Validators.required],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      medicamento: ['', Validators.required],
      paciente: ['', Validators.required],
      medico: ['', Validators.required]
    });
  }

  /** Convierte valores ISO de fecha al formato que acepta un input date. */
  private formatoFecha(fecha: string | Date): string {
    const valor = fecha instanceof Date ? fecha.toISOString() : fecha;
    return valor.slice(0, 10);
  }

  private openModal(): void {
    const modalElement = document.getElementById('modalFormulaMedica');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  closeModal(): void {
    this.modalInstance?.hide();
    this.form.reset();
    this.formulaSeleccionada = null;
  }
}
