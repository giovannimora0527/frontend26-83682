import { Component, OnInit } from '@angular/core';
import { FormulaMedica } from '../formula-medica.model';
import { FormulaMedicaService } from '../formula-medica.service';
import { Paciente } from '../../pacientes/paciente.model';
import { PacienteService } from '../../pacientes/paciente.service';
import { Veterinario } from '../../veterinarios/veterinario.model';
import { VeterinarioService } from '../../veterinarios/veterinario.service';
import { Cita } from '../../citas/cita.model';
import { CitaService } from '../../citas/cita.service';
import { HistoriaMedica } from '../../historias/historia-medica.model';
import { HistoriaMedicaService } from '../../historias/historia-medica.service';

/** Lista, filtra, pagina y permite crear, editar y consultar fórmulas. */
@Component({ selector: 'app-formula-list', templateUrl: './formula-list.component.html', styleUrls: ['./formula-list.component.css'] })
export class FormulaListComponent implements OnInit {
  formulas: FormulaMedica[] = [];
  pacientes: Paciente[] = [];
  veterinarios: Veterinario[] = [];
  citas: Cita[] = [];
  historias: HistoriaMedica[] = [];
  cargando = true;
  mensajeError = '';
  mensajeExito = '';
  filtro = '';
  pagina = 1;
  tamanoPagina = 5;
  ordenAscendente = false; ordenCampo = 'fechaCreacion';
  mostrarFormulario = false;
  formulaSeleccionada: FormulaMedica | null = null;
  editandoId: number | null = null;
  formulario: FormulaMedica = this.formularioVacio();

  constructor(private servicio: FormulaMedicaService, private pacienteService: PacienteService, private veterinarioService: VeterinarioService, private citaService: CitaService, private historiaService: HistoriaMedicaService) {}

  /** Carga fórmulas y mascotas al abrir el módulo. */
  ngOnInit(): void {
    this.cargar();
    this.pacienteService.listar().subscribe({ next: datos => this.pacientes = datos, error: () => this.mensajeError = 'No fue posible cargar las mascotas.' });
    this.veterinarioService.listar().subscribe({ next: datos => this.veterinarios = datos.filter(v => v.activo) });
    this.citaService.listarTodas().subscribe({ next: datos => this.citas = datos });
    this.historiaService.listar().subscribe({ next: datos => this.historias = datos });
  }
  /** Actualiza la tabla desde el backend. */
  cargar(): void {
    this.cargando = true;
    this.servicio.listar().subscribe({ next: datos => { this.formulas = datos; this.cargando = false; }, error: e => { this.mensajeError = e?.error?.mensaje || e?.error?.message || 'No se pudieron cargar las fórmulas. Verifique que el backend esté activo.'; this.cargando = false; } });
  }
  /** Filtrado textual en los campos principales del listado. */
  get formulasFiltradas(): FormulaMedica[] {
    const q = this.filtro.trim().toLowerCase();
    const resultado = this.formulas.filter(f => [f.medicamento, f.dosis, f.nombrePaciente, f.nombreVeterinario, f.frecuencia, f.indicaciones, f.citaId?.toString(), f.historiaMedicaId?.toString(), f.fechaEmision, f.cantidad?.toString()].some(v => (v || '').toLowerCase().includes(q)));
    return resultado.sort((a, b) => { const av: any = (a as any)[this.ordenCampo] ?? ''; const bv: any = (b as any)[this.ordenCampo] ?? ''; const cmp = this.ordenCampo.toLowerCase().includes('fecha') ? new Date(av || 0).getTime() - new Date(bv || 0).getTime() : String(av).localeCompare(String(bv), 'es', { numeric: true, sensitivity: 'base' }); return cmp * (this.ordenAscendente ? 1 : -1); });
  }
  /** Registros que se muestran en la página actual. */
  get formulasPagina(): FormulaMedica[] { const inicio = (this.pagina - 1) * this.tamanoPagina; return this.formulasFiltradas.slice(inicio, inicio + this.tamanoPagina); }
  /** Cantidad de páginas disponibles. */
  get totalPaginas(): number { return Math.max(1, Math.ceil(this.formulasFiltradas.length / this.tamanoPagina)); }
  /** Numeros de pagina para los botones de la paginacion. */
  get numerosPagina(): number[] { return Array.from({ length: this.totalPaginas }, (_, i) => i + 1); }
  /** Cambia la columna de orden y alterna la dirección si se repite. */
  ordenar(campo: string): void { if (this.ordenCampo === campo) this.ordenAscendente = !this.ordenAscendente; else { this.ordenCampo = campo; this.ordenAscendente = campo !== 'fechaCreacion'; } }
  /** Reinicia la paginación cuando cambia el filtro. */
  cambiarFiltro(): void { this.pagina = 1; }
  /** Abre un formulario limpio para crear. */
  nueva(): void { this.editandoId = null; this.formulario = this.formularioVacio(); this.mostrarFormulario = true; this.mensajeError = ''; this.mensajeExito = ''; }
  /** Precarga la fórmula seleccionada para edición. */
  editar(f: FormulaMedica): void { this.editandoId = f.id || null; this.formulario = { ...f }; this.mostrarFormulario = true; this.mensajeError = ''; this.mensajeExito = ''; }
  /** Consulta y muestra todos los campos de una fórmula. */
  ver(f: FormulaMedica): void { if (!f.id) return; this.servicio.obtener(f.id).subscribe({ next: dato => this.formulaSeleccionada = dato, error: e => this.mensajeError = e?.error?.mensaje || e?.error?.message || 'No fue posible consultar el detalle de la fórmula.' }); }
  /** Al cambiar mascota, se limpian relaciones clínicas de otra mascota. */
  cambiarMascota(): void { this.formulario.citaId = 0; this.formulario.historiaMedicaId = 0; }
  get citasDeMascota(): Cita[] { return this.citas.filter(c => c.pacienteId === this.formulario.pacienteId && (c.estado === 'ATENDIDA' || c.estado === 'COMPLETADA')); }
  get historiasDeMascota(): HistoriaMedica[] { return this.historias.filter(h => h.pacienteId === this.formulario.pacienteId); }

  /** Valida los datos básicos y guarda mediante POST o PUT. */
  guardar(): void {
    this.mensajeError = ''; this.mensajeExito = '';
    if (!this.formulario.medicamento?.trim() || !this.formulario.dosis?.trim() || !this.formulario.pacienteId || !this.formulario.cantidad || this.formulario.cantidad <= 0 || !this.formulario.citaId || !this.formulario.historiaMedicaId || !this.formulario.veterinarioId || !this.formulario.frecuencia?.trim()) { this.mensajeError = 'Complete mascota, cita, historia clínica, veterinario, medicamento, dosis, frecuencia y duración válida.'; return; }
    const peticion = this.editandoId ? this.servicio.actualizar(this.editandoId, this.formulario) : this.servicio.crear(this.formulario);
    peticion.subscribe({ next: () => { this.mostrarFormulario = false; this.mensajeExito = 'La fórmula médica se guardó correctamente.'; this.cargar(); }, error: e => this.mensajeError = e?.error?.mensaje || e?.error?.message || 'No fue posible guardar la fórmula. Revise los datos e intente nuevamente.' });
  }
  /** Crea el objeto inicial sin datos. */
  private formularioVacio(): FormulaMedica { return { medicamento: '', dosis: '', indicaciones: '', cantidad: 1, pacienteId: 0, citaId: 0, historiaMedicaId: 0, veterinarioId: 0, frecuencia: '' }; }
}
