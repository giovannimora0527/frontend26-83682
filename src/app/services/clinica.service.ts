import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

/** Modelo de datos «Especialidad» que se intercambia con el backend. */
export interface Especialidad { id?: number; codigo: string; nombre: string; descripcion: string | null; activo: boolean; }
/** Modelo de datos «ServicioClinico» que se intercambia con el backend. */
export interface ServicioClinico { id: number; especialidadId: number; nombre: string; }
/** Modelo de datos «TarifaClinica» que se intercambia con el backend. */
export interface TarifaClinica {
  /** Identificador único del registro (opcional). */
  id?: number; valor: number; iva: number; impuesto: number; desde: string; hasta: string | null; usuarioId?: number; fecha?: string;
}
/** Modelo de datos «DatosClinicos» que se intercambia con el backend. */
export interface DatosClinicos {
  /** Versión para el control de concurrencia optimista. */
  version: number; motivo: string | null; sintomas: string | null; diagnostico: string | null;
  /** Observaciones adicionales. */
  observaciones: string | null; recomendaciones: string | null;
}
/** Modelo de datos «LineaFormula» que se intercambia con el backend. */
export interface LineaFormula {
  /** Identificador de medicamento (opcional). */
  medicamentoId: number | null; nombre?: string; dosis: string; frecuencia: string; duracion: string;
  /** Cantidad (opcional). */
  cantidad: number; via: string; indicaciones: string | null; precioEstimado?: number;
}
/** Modelo de datos «FormulaClinica» que se intercambia con el backend. */
export interface FormulaClinica {
  /** Identificador único del registro. */
  id: number; citaId: number; paciente: string; estado: 'BORRADOR' | 'CONFIRMADA' | 'ANULADA';
  /** Revisión para el control de concurrencia optimista. */
  revision: number; creada: string; medicamentos: LineaFormula[];
}
/** Modelo de datos «AtencionClinica» que se intercambia con el backend. */
export interface AtencionClinica {
  /** Cita. */
  cita: { citaId: number; medico: string; mascota: string; propietario: string; estado: string; inicio: string };
  /** Atención. */
  atencion: (DatosClinicos & { id: number; historiaId: number; especialidad: string; finalizada: string | null }) | null;
  /** Antecedentes. */
  antecedentes: { fecha: string | null; medico: string; descripcion: string }[];
  /** Servicios. */
  servicios: { servicioId: number; nombre: string; cantidad: number; valor: number; iva: number; impuesto: number }[];
  /** Catalogo. */
  catalogo: { servicio: ServicioClinico; tarifa: TarifaClinica | null }[];
  /** Formulario reactivo: fórmulas. */
  formulas: FormulaClinica[];
}

/** Servicio de clínica: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class ClinicaService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http = inject(HttpClient);
  /** URL base de la API del backend. */
  private readonly base = environment.apiUrlAuth;
  /** Admin. */
  private readonly admin = this.base + '/tarifario';
  /** Clínica. */
  private readonly clinica = this.base + '/atencion';

  /** Especialidades. */
  especialidades() { return this.http.get<Especialidad[]>(this.admin + '/especialidades'); }
  /**
   * Guarda especialidad mediante la API del backend.
   *
   * @param datos datos a enviar.
   * @returns observable con la respuesta del backend.
   */
  guardarEspecialidad(datos: Especialidad) {
    const url = this.admin + '/especialidades';
    return datos.id ? this.http.put<Especialidad>(url + '/' + datos.id, datos) : this.http.post<Especialidad>(url, datos);
  }

  /**
   * Servicios mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  servicios(id: number) { return this.http.get<ServicioClinico[]>(this.admin + '/especialidades/' + id + '/servicios'); }
  /**
   * Agrega servicio mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param nombre nombre del archivo o registro.
   * @returns observable con la respuesta del backend.
   */
  agregarServicio(id: number, nombre: string) {
    return this.http.post<ServicioClinico>(this.admin + '/especialidades/' + id + '/servicios', { nombre });
  }
  /**
   * Consulta el historial mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  historial(id: number) { return this.http.get<TarifaClinica[]>(this.admin + '/servicios/' + id + '/tarifas'); }
  /**
   * Prepara el formulario para un nuevo registro de tarifa mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param tarifa tarifa.
   * @returns observable con la respuesta del backend.
   */
  nuevaTarifa(id: number, tarifa: TarifaClinica) {
    return this.http.post<TarifaClinica>(this.admin + '/servicios/' + id + '/tarifas', { ...tarifa, hasta: tarifa.hasta || null });
  }

  /**
   * Consulta clínica mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  consultar(id: number) { return this.http.get<AtencionClinica>(this.cita(id)); }
  /**
   * Abre clínica mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  abrir(id: number) { return this.http.post<AtencionClinica>(this.cita(id) + '/abrir', null); }
  /**
   * Guarda clínica mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param datos datos a enviar.
   * @param servicios servicios.
   * @returns observable con la respuesta del backend.
   */
  guardar(id: number, datos: DatosClinicos, servicios: { servicioId: number; cantidad: number }[]) {
    return this.http.put<AtencionClinica>(this.cita(id), { ...datos, servicios });
  }
  /**
   * Finaliza clínica mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param version versión.
   * @returns observable con la respuesta del backend.
   */
  finalizar(id: number, version: number) {
    return this.http.post<AtencionClinica>(this.cita(id) + '/finalizar', null, { params: { version } });
  }
  /**
   * Descarga la prefactura en PDF mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  prefactura(id: number) { return this.http.get(this.cita(id) + '/prefactura', { responseType: 'blob' }); }

  /**
   * Citas propias mediante la API del backend.
   *
   * @returns observable con la respuesta del backend.
   */
  citasPropias() {
    return this.http.get<{ id: number; mascotaId: number; fechaHora: string; estado: string }[]>(this.base + '/cita/listar');
  }
  /** Fórmulas. */
  formulas() { return this.http.get<FormulaClinica[]>(this.clinica + '/formulas'); }
  /**
   * Guarda fórmula.
   *
   * @param cita cita seleccionada.
   * @param formula fórmula.
   * @param medicamentos medicamentos.
   */
  guardarFormula(cita: number, formula: FormulaClinica | null, medicamentos: LineaFormula[]) {
    const url = this.cita(cita) + '/formulas';
    const dto = { revision: formula?.revision ?? null, medicamentos };
    return formula ? this.http.put<FormulaClinica>(url + '/' + formula.id, dto) : this.http.post<FormulaClinica>(url, dto);
  }
  /**
   * Resuelve fórmula mediante la API del backend.
   *
   * @param formula fórmula.
   * @param accion acción.
   * @returns observable con la respuesta del backend.
   */
  resolverFormula(formula: FormulaClinica, accion: 'confirmar' | 'anular') {
    return this.http.post<FormulaClinica>(this.clinica + '/formulas/' + formula.id + '/' + accion, null,
      { params: { revision: formula.revision } });
  }
  /**
   * Descarga el PDF de la fórmula de PDF mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param historica histórica.
   * @returns observable con la respuesta del backend.
   */
  formulaPdf(id: number, historica = false) {
    return this.http.get(this.clinica + '/formulas/' + (historica ? 'legadas/' : '') + id + '/pdf', { responseType: 'blob' });
  }

  /**
   * Cita.
   *
   * @param id identificador del registro.
   */
  private cita(id: number) { return this.clinica + '/citas/' + id; }
}

/**
 * Descargar clínica.
 *
 * @param blob contenido del archivo.
 * @param nombre nombre del archivo o registro.
 */
export function descargarClinica(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function mensajeClinica(err: { error?: unknown }) {
  try {
    const error = err.error instanceof Blob ? JSON.parse(await err.error.text()) : err.error;
    return (error as { mensaje?: string; detail?: string })?.mensaje
      ?? (error as { detail?: string })?.detail ?? 'No fue posible completar la operación.';
  } catch { return 'No fue posible completar la operación.'; }
}
