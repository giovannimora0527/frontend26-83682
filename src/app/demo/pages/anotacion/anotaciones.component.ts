import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AnotacionClinica, AnotacionRequest, HistoriaClinica, Veterinario } from 'src/app/models/clinica';
import { MedicoService } from '../medico/service/medico.service';
import { HistoriaClinicaService } from '../historia-clinica/service/historia-clinica.service';
import { apiErrorMessage } from 'src/app/services/api-error';

@Component({ selector: 'app-anotaciones', standalone: true, imports: [CommonModule, FormsModule, ReactiveFormsModule], templateUrl: './anotaciones.component.html', styleUrls: ['./anotaciones.component.scss'] })
export class AnotacionesComponent implements OnInit {
  anotaciones: AnotacionClinica[] = []; historias: HistoriaClinica[] = []; veterinarios: Veterinario[] = [];
  pagina = 0; tamanio = 10; totalPaginas = 0; totalElementos = 0; readonly tamanios = [10, 20, 50];
  orden = 'fechaHora'; direccion: 'ASC' | 'DESC' = 'DESC'; exito = '';
  errorOpciones = '';
  filtroHistoria = ''; filtroVeterinario = ''; filtroFecha = '';
  cargando = false; guardando = false; modalAbierto = false; error = ''; errorFormulario = ''; detalle: AnotacionClinica | null = null; errorDetalle = '';
  formulario: FormGroup;
  constructor(private readonly fb: FormBuilder, private readonly api: HistoriaClinicaService, private readonly vetApi: MedicoService) {
    this.formulario = this.fb.group({ historiaClinicaId: [null, Validators.required], veterinarioId: [null, Validators.required], fechaHora: [''], descripcion: ['', [Validators.required, Validators.maxLength(500)]], observacion: ['', [Validators.required, Validators.maxLength(2000)]], diagnosticoEvolucion: ['', [Validators.required, Validators.maxLength(2000)]] });
  }
  ngOnInit(): void { this.api.listar({ page: 0, size: 100 }).subscribe({ next: p => this.historias = p.content ?? [], error: () => this.errorOpciones = 'No se pudieron cargar las historias clínicas.' }); this.vetApi.listar().subscribe({ next: x => this.veterinarios = x, error: () => this.errorOpciones = 'No se pudieron cargar los veterinarios.' }); this.listar(); }
  listar(): void { this.cargando = true; this.error = ''; this.api.listarTodasLasAnotaciones({ page: this.pagina, size: this.tamanio, sort: this.orden, direction: this.direccion, historiaClinicaId: this.filtroHistoria ? +this.filtroHistoria : undefined, veterinarioId: this.filtroVeterinario ? +this.filtroVeterinario : undefined, fecha: this.filtroFecha || undefined }).subscribe({ next: p => { this.anotaciones = p.content ?? []; this.totalPaginas = p.totalPages ?? 0; this.totalElementos = p.totalElements ?? 0; this.cargando = false; }, error: e => { this.error = this.mensajeError(e, 'No se pudieron cargar las anotaciones.'); this.cargando = false; } }); }
  aplicarFiltros(): void { this.pagina = 0; this.listar(); }
  limpiarFiltros(): void { this.filtroHistoria = ''; this.filtroVeterinario = ''; this.filtroFecha = ''; this.aplicarFiltros(); }
  cambiarPagina(p: number): void { if (p >= 0 && p < this.totalPaginas) { this.pagina = p; this.listar(); } }
  cambiarTamanio(v: string): void { this.tamanio = +v; this.pagina = 0; this.listar(); }
  ordenarPor(campo: string): void { this.direccion = this.orden === campo && this.direccion === 'DESC' ? 'ASC' : 'DESC'; this.orden = campo; this.pagina = 0; this.listar(); }
  abrirCrear(): void { this.formulario.reset(); this.errorFormulario = ''; this.modalAbierto = true; }
  guardar(): void { if (this.formulario.invalid || this.guardando) { this.formulario.markAllAsTouched(); return; } const v = this.formulario.getRawValue(); const req: AnotacionRequest = { historiaClinicaId: +v.historiaClinicaId, veterinarioId: +v.veterinarioId, fechaHora: v.fechaHora ? (String(v.fechaHora).length === 16 ? `${v.fechaHora}:00` : v.fechaHora) : undefined, descripcion: String(v.descripcion).trim(), observacion: String(v.observacion).trim(), diagnosticoEvolucion: String(v.diagnosticoEvolucion).trim() }; this.guardando = true; this.errorFormulario = ''; this.api.crearAnotacion(req).subscribe({ next: () => { this.guardando = false; this.modalAbierto = false; this.exito = 'Anotación clínica creada correctamente.'; this.listar(); }, error: e => { this.guardando = false; this.errorFormulario = this.mensajeError(e, 'No se pudo crear la anotación.'); } }); }
  verDetalle(n: AnotacionClinica): void { this.errorDetalle = ''; this.detalle = null; this.api.consultarAnotacion(n.id).subscribe({ next: x => this.detalle = x, error: e => this.errorDetalle = this.mensajeError(e, 'No se pudo consultar la anotación.') }); }
  nombreVet(id: number): string { const v = this.veterinarios.find(x => x.id === id); return v ? `${v.nombres} ${v.apellidos}`.trim() : 'No disponible'; }
  /** Etiqueta legible de una historia: "Mascota · motivo (dd/mm/aaaa)". */
  nombreHistoria(id: number): string {
    const h = this.historias.find(x => x.id === id);
    if (!h) return `Historia clínica N.º ${id}`;
    const partes = [h.mascotaNombre ?? h.mascota?.nombreMascota, h.motivoConsulta].filter(Boolean).join(' · ');
    const fecha = h.fechaHora ? new Date(h.fechaHora) : null;
    const fechaTexto = fecha && !isNaN(fecha.getTime())
      ? `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}` : '';
    return `${partes || `Historia clínica N.º ${id}`}${fechaTexto ? ` (${fechaTexto})` : ''}`;
  }
  /** Muestra un texto opcional o "No registrado" cuando un registro antiguo no lo tiene. */
  textoOpcional(valor?: string | null): string { return valor?.trim() ? valor : 'No registrado'; }
  cerrarModal(): void { this.modalAbierto = false; this.errorFormulario = ''; }
  private mensajeError(e: unknown, fallback: string): string { return apiErrorMessage(e, fallback); }
}
