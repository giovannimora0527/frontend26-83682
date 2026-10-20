import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';
import { HistoriaService } from './service/historia.service';

@Component({
  selector: 'app-historia',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './historia.component.html',
  styleUrl: './historia.component.scss'
})
export class HistoriaComponent implements OnInit {
  listAnotaciones: any[] = [];
  listMascotas: any[] = [];
  listMedicos: any[] = [];
  form!: FormGroup;
  modalInstance: Modal | null = null;
  enviando = false;

  // Variables para búsqueda, paginación y orden
  terminoBusqueda = '';
  paginaActual = 1;
  readonly registrosPorPagina = 5;
  
  columnaOrden: string = 'fecha';
  direccionOrden: 'asc' | 'desc' = 'desc'; // Más recientes primero

  constructor(private historiaService: HistoriaService, private fb: FormBuilder) {}

  ngOnInit() {
    this.listar();
    this.inicializarFormulario();
    this.cargarCombos();
  }

  inicializarFormulario() {
    this.form = this.fb.group({
      mascota: [null, Validators.required],
      medico: [null, Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  cargarCombos() {
    this.historiaService.listarMascotas().subscribe(res => this.listMascotas = res);
    this.historiaService.listarMedicos().subscribe(res => this.listMedicos = res);
  }

  listar() {
    this.historiaService.listarAnotaciones().subscribe(res => {
      this.listAnotaciones = res;
    });
  }

  // --- LÓGICA DE FILTRO INTELIGENTE (IGNORA TILDES Y MAYÚSCULAS) ---
  private normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto
      .toLowerCase() // Convierte a minúsculas
      .normalize('NFD') // Descompone las letras con tildes
      .replace(/[\u0300-\u036f]/g, ''); // Elimina los acentos
  }

  get anotacionesFiltradas() {
    // 1. Normalizamos lo que el usuario escribió
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    let filtradas = this.listAnotaciones;

    if (termino) {
      filtradas = this.listAnotaciones.filter(a => {
        // 2. Normalizamos los textos de la base de datos antes de comparar
        const nombreMascota = this.normalizarTexto(a.historia?.mascota?.nombreMascota || '');
        const nombreDueno = this.normalizarTexto(`${a.historia?.mascota?.cliente?.nombres || ''} ${a.historia?.mascota?.cliente?.apellidos || ''}`);
        const nombreMedico = this.normalizarTexto(`${a.medico?.nombres || ''} ${a.medico?.apellidos || ''}`);
        const descripcion = this.normalizarTexto(a.descripcion || '');

        // 3. Hacemos la comparación
        return nombreMascota.includes(termino) || 
               nombreDueno.includes(termino) || 
               nombreMedico.includes(termino) || 
               descripcion.includes(termino);
      });
    }

    // 4. Aplicamos el ordenamiento
    return filtradas.sort((a, b) => {
      let valorA = this.obtenerValorParaOrden(a, this.columnaOrden);
      let valorB = this.obtenerValorParaOrden(b, this.columnaOrden);

      if (valorA < valorB) return this.direccionOrden === 'asc' ? -1 : 1;
      if (valorA > valorB) return this.direccionOrden === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private obtenerValorParaOrden(anotacion: any, columna: string): any {
    switch (columna) {
      case 'fecha': return new Date(anotacion.fecha).getTime();
      case 'mascota': return anotacion.historia?.mascota?.nombreMascota?.toLowerCase() || '';
      case 'dueno': return `${anotacion.historia?.mascota?.cliente?.nombres || ''}`.toLowerCase();
      case 'medico': return `${anotacion.medico?.nombres || ''}`.toLowerCase();
      case 'descripcion': return anotacion.descripcion?.toLowerCase() || '';
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

  get anotacionesPaginadas() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.anotacionesFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  get totalPaginas() {
    return Math.ceil(this.anotacionesFiltradas.length / this.registrosPorPagina);
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

  // --- MODAL ---
  abrirModal() {
    this.form.reset();
    const modalElement = document.getElementById('modalHistoria');
    if (modalElement) {
      this.modalInstance ??= new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  closeModal() {
    this.modalInstance?.hide();
  }

  guardarAnotacion() {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.value;
    const anotacion = {
      mascotaId: valores.mascota.mascotaId,
      medicoId: valores.medico.id,
      descripcion: valores.descripcion
    };

    this.enviando = true;
    this.historiaService.crearAnotacion(anotacion).subscribe({
      next: (res) => {
        this.enviando = false;
        this.closeModal();
        this.listar();
        Swal.fire('Éxito', res.message || 'Anotación creada', 'success');
      },
      error: (err) => {
        this.enviando = false;
        Swal.fire('Error', err.error?.message || 'Error al guardar', 'error');
      }
    });
  }

  compararObjetos(o1: any, o2: any): boolean {
    return o1 && o2 ? (o1.id === o2.id || o1.mascotaId === o2.mascotaId) : o1 === o2;
  }
}