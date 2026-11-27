import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, Observable } from 'rxjs';
import { hoyBogota } from '../../../services/agenda.service';
import { ClinicaService, Especialidad, mensajeClinica, ServicioClinico, TarifaClinica } from '../../../services/clinica.service';

import { PaginadorComponent, PaginaLocal } from '../../../utils/paginador.component';
import { confirmar } from '../../../utils/dialogos';
/** Pantalla «tarifario» del sistema de la clínica veterinaria: muestra los datos, valida los formularios y llama a los servicios del backend. */
@Component({
  selector: 'app-tarifario',
  imports: [PaginadorComponent, CommonModule, FormsModule],
  templateUrl: './tarifario.component.html'
})
export class TarifarioComponent implements OnInit {
  /** Paginación de la lista «especialidades». */
  readonly pagEspecialidades = new PaginaLocal();
  /** Paginación de la lista «historial de tarifas». */
  readonly pagTarifas = new PaginaLocal();
  /** Ruta del recurso en la API del backend. */
  private readonly api = inject(ClinicaService);
  /** Modo consulta (Recepción): oculta registro y edición; los precios se consultan pero no se modifican. */
  @Input() soloLectura = false;
  /** Lista de especialidades. */
  especialidades: Especialidad[] = [];
  /** Especialidad. */
  especialidad: Especialidad | null = null;
  /** Edición. */
  edicion: Especialidad | null = null;
  /** Lista de servicios. */
  servicios: ServicioClinico[] = [];
  /** Servicio. */
  servicio: ServicioClinico | null = null;
  /** Lista de historial. */
  historial: TarifaClinica[] = [];
  /** Tarifa. */
  tarifa: TarifaClinica | null = null;
  /** Nombre servicio. */
  nombreServicio = '';
  /** Mensaje mostrado al usuario (error). */
  error = '';
  /** Mensaje mostrado al usuario (aviso). */
  aviso = '';
  /** Indica si ocupado. */
  ocupado = false;

  /** Inicializa el componente y carga los datos iniciales. */
  ngOnInit() { this.cargar(); }
  /** Carga los datos de la pantalla desde el backend. */
  cargar() { this.operar(this.api.especialidades(), datos => { this.especialidades = datos; }); }
  /**
   * Prepara el formulario para editar los datos de la pantalla.
   *
   * @param e evento del navegador.
   */
  editar(e?: Especialidad) { this.edicion = e ? { ...e } : { codigo: '', nombre: '', descripcion: null, activo: true }; }
  /**
   * Guarda los datos de la pantalla validando el formulario y enviándolo al backend.
   *
   * @param e evento del navegador.
   */
  guardar(e: Especialidad) {
    this.operar(this.api.guardarEspecialidad(e), actual => {
      this.edicion = null;
      this.aviso = 'Especialidad guardada.';
      if (this.especialidad?.id === actual.id) this.especialidad = actual;
      this.cargar();
    });
  }

  /**
   * Muestra los datos de la pantalla.
   *
   * @param e evento del navegador.
   */
  ver(e: Especialidad) {
    this.especialidad = e;
    this.pagTarifas.reiniciar();
    this.servicio = null;
    this.tarifa = null;
    this.historial = [];
    this.servicios = [];
    this.operar(this.api.servicios(e.id!), servicios => { this.servicios = servicios; });
  }

  /**
   * Agrega servicio.
   *
   * @param e evento del navegador.
   */
  agregarServicio(e: Especialidad) {
    this.operar(this.api.agregarServicio(e.id!, this.nombreServicio), s => {
      this.nombreServicio = '';
      this.servicios = [...this.servicios, s];
      this.verTarifas(s);
    });
  }

  /**
   * Muestra tarifas.
   *
   * @param s s.
   */
  verTarifas(s: ServicioClinico) {
    this.servicio = s;
    this.tarifa = null;
    this.operar(this.api.historial(s.id), tarifas => { this.historial = tarifas; });
  }

  /** Prepara el formulario para un nuevo registro de tarifa. */
  nuevaTarifa() { this.tarifa = { valor: 0, iva: 0, impuesto: 0, desde: hoyBogota(), hasta: null }; }

  /**
   * Registra los datos de la pantalla.
   *
   * @param s s.
   * @param datos datos a enviar.
   */
  async registrar(s: ServicioClinico, datos: TarifaClinica) {
    if (!(await confirmar('¿Registrar esta nueva vigencia de tarifa?'))) return;
    this.operar(this.api.nuevaTarifa(s.id, datos), () => {
      this.aviso = 'Vigencia registrada. Se conservó el historial.';
      this.verTarifas(s);
    });
  }

  /**
   * Ejecuta la operación los datos de la pantalla.
   *
   * @param req solicitud HTTP saliente.
   * @param ok ok.
   */
  private operar<T>(req: Observable<T>, ok: (dato: T) => void) {
    this.error = '';
    this.ocupado = true;
    req.pipe(finalize(() => { this.ocupado = false; })).subscribe({ next: ok, error: async e => { this.error = await mensajeClinica(e); } });
  }
}
