
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { FormulaMedica } from '../../../models/formula-medica';
import { FormulaMedicaService } from '../../../services/formula-medica.service';

@Component({
  selector: 'app-formula',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './formula.component.html',
  styleUrls: ['./formula.component.scss']
})
export class FormulaComponent implements OnInit {

  // ========================================================
  // 1. LISTADO Y BÚSQUEDA
  // ========================================================

  formulasMedicas: FormulaMedica[] = [];
  textoBusqueda: string = '';

  cargando: boolean = false;
  guardando: boolean = false;

  mensajeError: string = '';
  mensajeExito: string = '';
  mensajeErrorFormulario: string = '';

  // ========================================================
  // 2. PAGINACIÓN Y ORDENAMIENTO
  // ========================================================

  paginaActual: number = 1;
  registrosPorPagina: number = 10;

  columnaOrden: keyof FormulaMedica =
    'fechaCreacionRegistro';

  direccionOrden: 'asc' | 'desc' = 'desc';

  // ========================================================
  // 3. CREACIÓN, EDICIÓN Y DETALLE
  // ========================================================

  mostrarFormulario: boolean = false;
  mostrarDetalle: boolean = false;

  modoFormulario: 'crear' | 'editar' = 'crear';

  formulaIdEditar: number | null = null;
  formulaDetalle: FormulaMedica | null = null;

  formularioFormula: FormGroup;

  constructor(
    private formulaMedicaService: FormulaMedicaService,
    private fb: FormBuilder
  ) {

    // Formulario reactivo con validaciones básicas.
    this.formularioFormula = this.fb.group({

      citaId: [
        null,
        [Validators.required, Validators.min(1)]
      ],

      medicamentoId: [
        null,
        [Validators.required, Validators.min(1)]
      ],

      dosis: [
        '',
        [Validators.required]
      ],

      frecuencia: [
        '',
        [Validators.required, Validators.maxLength(100)]
      ],

      duracionTratamiento: [
        '',
        [Validators.required, Validators.maxLength(100)]
      ],

      indicaciones: [''],

      fechaEmision: [
        '',
        [Validators.required]
      ]

    });

  }

  // ========================================================
  // 4. INICIALIZACIÓN
  // ========================================================

  ngOnInit(): void {
    this.cargarFormulasMedicas();
  }

  // ========================================================
  // 5. CONSULTAR FÓRMULAS
  // ========================================================

  cargarFormulasMedicas(): void {

    this.cargando = true;
    this.mensajeError = '';

    this.formulaMedicaService
      .listarFormulasMedicas()
      .subscribe({

        next: (respuesta: FormulaMedica[]) => {

          this.formulasMedicas = respuesta || [];
          this.cargando = false;

          console.log(
            'Fórmulas médicas cargadas:',
            this.formulasMedicas
          );

        },

        error: (error) => {

          console.error(error);

          this.mensajeError =
            'No fue posible consultar las fórmulas médicas.';

          this.cargando = false;

        }

      });
  }

  // ========================================================
  // 6. FILTRAR FÓRMULAS
  // ========================================================

  get formulasFiltradas(): FormulaMedica[] {

    const busqueda = this.textoBusqueda
      .toLowerCase()
      .trim();

    if (!busqueda) {
      return this.formulasMedicas;
    }

    return this.formulasMedicas.filter(formula => {

      return (
        String(formula.id).includes(busqueda) ||

        String(formula.citaId).includes(busqueda) ||

        String(formula.medicamentoId).includes(busqueda) ||

        (formula.dosis || '')
          .toLowerCase()
          .includes(busqueda) ||

        (formula.indicaciones || '')
          .toLowerCase()
          .includes(busqueda) ||

        (formula.frecuencia || '')
          .toLowerCase()
          .includes(busqueda)
      );

    });
  }

  limpiarBusqueda(): void {
    this.textoBusqueda = '';
    this.paginaActual = 1;
  }

  // ========================================================
  // 7. ORDENAR LOS REGISTROS
  // ========================================================

  ordenarPor(columna: keyof FormulaMedica): void {

    if (this.columnaOrden === columna) {

      this.direccionOrden =
        this.direccionOrden === 'asc' ? 'desc' : 'asc';

    } else {

      this.columnaOrden = columna;
      this.direccionOrden = 'asc';

    }

    this.paginaActual = 1;
  }

  get formulasOrdenadas(): FormulaMedica[] {

    return [...this.formulasFiltradas].sort((a, b) => {

      const valorA = a[this.columnaOrden];
      const valorB = b[this.columnaOrden];

      let comparacion: number;

      if (
        typeof valorA === 'number' &&
        typeof valorB === 'number'
      ) {

        comparacion = valorA - valorB;

      } else {

        comparacion = String(valorA ?? '')
          .localeCompare(
            String(valorB ?? ''),
            'es'
          );

      }

      return this.direccionOrden === 'asc'
        ? comparacion
        : -comparacion;

    });
  }

  // ========================================================
  // 8. PAGINACIÓN
  // ========================================================

  get totalPaginas(): number {

    return Math.max(
      1,
      Math.ceil(
        this.formulasFiltradas.length /
        this.registrosPorPagina
      )
    );
  }

  get formulasPaginadas(): FormulaMedica[] {

    const inicio =
      (this.paginaActual - 1) * this.registrosPorPagina;

    return this.formulasOrdenadas.slice(
      inicio,
      inicio + this.registrosPorPagina
    );
  }

  cambiarPagina(pagina: number): void {

    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // ========================================================
  // 9. ABRIR FORMULARIO PARA CREAR
  // ========================================================

  abrirNuevaFormula(): void {

    this.modoFormulario = 'crear';
    this.formulaIdEditar = null;

    this.mensajeErrorFormulario = '';
    this.mensajeExito = '';

    this.formularioFormula.reset({
      citaId: null,
      medicamentoId: null,
      dosis: '',
      frecuencia: '',
      duracionTratamiento: '',
      indicaciones: '',
      fechaEmision: ''
    });

    this.mostrarFormulario = true;
    this.mostrarDetalle = false;
  }

  // ========================================================
  // 10. ABRIR FORMULARIO PARA EDITAR
  // ========================================================

  abrirEditarFormula(formula: FormulaMedica): void {

    this.modoFormulario = 'editar';
    this.formulaIdEditar = formula.id;

    this.mensajeErrorFormulario = '';
    this.mensajeExito = '';

    this.formularioFormula.patchValue({

      citaId: formula.citaId,

      medicamentoId: formula.medicamentoId,

      dosis: formula.dosis,

      frecuencia: formula.frecuencia || '',

      duracionTratamiento:
        formula.duracionTratamiento || '',

      indicaciones: formula.indicaciones || '',

      // El control datetime-local necesita YYYY-MM-DDTHH:mm.
      fechaEmision: formula.fechaEmision
        ? formula.fechaEmision.slice(0, 16)
        : ''

    });

    this.mostrarFormulario = true;
    this.mostrarDetalle = false;
  }

  // ========================================================
  // 11. GUARDAR O ACTUALIZAR
  // ========================================================

  guardarFormula(): void {

    // Evitar peticiones repetidas.
    if (this.guardando) {
      return;
    }

    this.mensajeErrorFormulario = '';
    this.mensajeExito = '';

    // Validar controles obligatorios.
    if (this.formularioFormula.invalid) {

      this.formularioFormula.markAllAsTouched();

      this.mensajeErrorFormulario =
        'Completa correctamente todos los campos obligatorios.';

      return;
    }

    const valores = this.formularioFormula.value;

    // Evitar aceptar únicamente espacios.
    if (
      !String(valores.dosis || '').trim() ||
      !String(valores.frecuencia || '').trim() ||
      !String(valores.duracionTratamiento || '').trim()
    ) {

      this.mensajeErrorFormulario =
        'La dosis, frecuencia y duración no pueden estar vacías.';

      return;
    }

    // Preparar datos para Spring Boot.
    const datos: Partial<FormulaMedica> = {

      citaId: Number(valores.citaId),

      medicamentoId: Number(valores.medicamentoId),

      dosis: String(valores.dosis).trim(),

      frecuencia: String(valores.frecuencia).trim(),

      duracionTratamiento:
        String(valores.duracionTratamiento).trim(),

      indicaciones:
        String(valores.indicaciones || '').trim(),

      fechaEmision: valores.fechaEmision

    };

    this.guardando = true;

    // Determinar si corresponde POST o PUT.
    const peticion =
      this.modoFormulario === 'editar' &&
      this.formulaIdEditar !== null

        ? this.formulaMedicaService.actualizarFormula(
            this.formulaIdEditar,
            datos
          )

        : this.formulaMedicaService.crearFormula(datos);

    peticion.subscribe({

      next: () => {

        this.guardando = false;
        this.mostrarFormulario = false;

        this.mensajeExito =
          this.modoFormulario === 'crear'
            ? 'La fórmula médica fue creada correctamente.'
            : 'La fórmula médica fue actualizada correctamente.';

        this.paginaActual = 1;

        // Actualizar el listado con datos de MySQL.
        this.cargarFormulasMedicas();

      },

      error: (error) => {

        console.error(
          'Error al guardar fórmula médica:',
          error
        );

        this.guardando = false;

        this.mensajeErrorFormulario =
          error?.error?.message ||
          error?.error?.detail ||
          'No fue posible guardar la fórmula médica. Revisa los datos ingresados.';

      }

    });
  }

  // ========================================================
  // 12. CERRAR FORMULARIO
  // ========================================================

  cerrarFormulario(): void {

    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
    this.formulaIdEditar = null;
    this.mensajeErrorFormulario = '';
  }

  // ========================================================
  // 13. VER DETALLE DE UNA FÓRMULA
  // ========================================================

  verDetalleFormula(formula: FormulaMedica): void {

    this.formulaDetalle = formula;
    this.mostrarDetalle = true;
    this.mostrarFormulario = false;
  }

  cerrarDetalle(): void {

    this.mostrarDetalle = false;
    this.formulaDetalle = null;
  }

}
