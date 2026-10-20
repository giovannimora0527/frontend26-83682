import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import { FormulaService } from './service/formula.service';
import { Formula } from 'src/app/models/formula';

@Component({
  selector: 'app-formula',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './formula.component.html',
  styleUrl: './formula.component.scss'
})
export class FormulaComponent implements OnInit {
  
  // Variables para el modal.
  modalInstance: Modal | null = null;
  titleModal: string = "";
  modoFormulario: string = "";
  titleBoton: string = "";

  // Variables para la paginación y búsqueda en la datatable.
  listFormulas: Formula[] = [];
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;

  // Variables para ordenamiento
  columnaOrden: string = 'fechaCreacionRegistro';
  direccionOrden: 'asc' | 'desc' = 'desc'; // Por defecto, las más recientes primero

  // Listas para los combos
  listaCitas: any[] = [];
  listaMedicamentos: any[] = [];

  // Formulario reactivo y estado
  form!: FormGroup;
  formulaSelected: Formula | null = null;
  enviando = false;

  constructor(
    private readonly formulaService: FormulaService,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.listar();
    this.inicializarFormulario();
    this.cargarCitas();
    this.cargarMedicamentos();
  }

  inicializarFormulario() {
    this.form = this.formBuilder.group({
      cita: [null, Validators.required],
      medicamento: [null, Validators.required],
      dosis: ['', Validators.required],
      indicaciones: ['', Validators.required]
    });
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  // --- CARGAS DE COMBOS ---
  cargarCitas() {
    this.formulaService.listarCitas().subscribe({
      next: (res) => this.listaCitas = res,
      error: (err) => console.error('Error al cargar citas:', err)
    });
  }

  cargarMedicamentos() {
    this.formulaService.listarMedicamentos().subscribe({
      next: (res) => this.listaMedicamentos = res,
      error: (err) => console.error('Error al cargar medicamentos:', err)
    });
  }

  // --- LÓGICA DE LA TABLA (FILTRO Y ORDENAMIENTO) ---
  listar() {
    this.formulaService.listarFormulas().subscribe({
      next: (data) => {
        this.listFormulas = data;
        this.paginaActual = 1;
      },
      error: (error) => console.error('Error al listar fórmulas:', error)
    });
  }

  get formulasFiltradas() {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    let filtradas = this.listFormulas;

    // 1. Filtro
    if (termino) {
      filtradas = this.listFormulas.filter(f => 
        f.dosis.toLowerCase().includes(termino) || 
        (f.medicamento?.nombre && f.medicamento.nombre.toLowerCase().includes(termino))
      );
    }

    // 2. Ordenamiento
    return filtradas.sort((a, b) => {
      let valorA = this.obtenerValorParaOrden(a, this.columnaOrden);
      let valorB = this.obtenerValorParaOrden(b, this.columnaOrden);

      if (valorA < valorB) return this.direccionOrden === 'asc' ? -1 : 1;
      if (valorA > valorB) return this.direccionOrden === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private obtenerValorParaOrden(formula: any, columna: string): any {
    switch (columna) {
      case 'cita': return formula.cita?.id?.toString() || '';
      case 'medicamento': return formula.medicamento?.nombre?.toLowerCase() || '';
      case 'dosis': return formula.dosis?.toLowerCase() || '';
      case 'fechaCreacionRegistro': return new Date(formula.fechaCreacionRegistro).getTime();
      default: return '';
    }
  }

  ordenarPor(columna: string) {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
  }

  get formulasPaginadas() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.formulasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas() {
    return Math.ceil(this.formulasFiltradas.length / this.registrosPorPagina);
  }

  get paginas() {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  actualizarBusqueda(event: Event) {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  cambiarPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // --- LÓGICA DEL MODAL ---
  nuevaFormula(modo: string) {
    this.titleModal = modo === 'C' ? 'Crear Fórmula Médica' : 'Editar Fórmula';
    this.modoFormulario = modo;
    this.formulaSelected = null;
    this.resetFormulario();
    this.openModal(modo);
  }

  resetFormulario() {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  abrirEdicion(formula: Formula) {
    this.formulaSelected = formula;
    this.modoFormulario = 'E';
    this.form.patchValue({
      cita: formula.cita || null, 
      medicamento: formula.medicamento || null,
      dosis: formula.dosis,
      indicaciones: formula.indicaciones
    });
    this.openModal(this.modoFormulario);
  }

  openModal(modo: string) {
    this.titleBoton = modo === 'C' ? 'Guardar' : 'Actualizar';
    const modalElement = document.getElementById('modalFormula');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  closeModal() {
    if (this.modalInstance) {
      this.modalInstance.hide();
    }
    this.resetFormulario();
  }

  // --- GUARDAR (POST o PUT) ---
  guardarFormula() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    
    const formula: Formula = {
      id: this.formulaSelected?.id, 
      citaId: valores.cita.id || valores.cita.citaId, 
      medicamentoId: valores.medicamento.id || valores.medicamento.medicamentoId,
      dosis: valores.dosis,
      indicaciones: valores.indicaciones
    };

    this.enviando = true;
    
    const solicitud = this.modoFormulario === 'C'
      ? this.formulaService.crearFormula(formula)
      : this.formulaService.actualizarFormula(formula);

    solicitud.subscribe({
      next: (respuesta: any) => {
        Swal.fire('Éxito', respuesta.message || respuesta.mensaje || 'Operación exitosa', 'success');
        this.enviando = false;
        this.closeModal();
        this.listar(); 
        
      },
      error: (error) => {
        this.enviando = false;
        const msj = error.error?.message || error.error?.mensaje || 'Error al guardar.';
        Swal.fire('Error', msj, 'error');
      }
    });
  }

  compararObjetos(o1: any, o2: any): boolean {
    if (!o1 || !o2) return o1 === o2;
    return o1.id === o2.id || o1.citaId === o2.citaId || o1.medicamentoId === o2.medicamentoId;
  }
}