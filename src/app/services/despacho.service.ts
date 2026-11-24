import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** Estados despacho. */
export const estadosDespacho = [
  'PENDIENTE_DESPACHO', 'EN_PREPARACION', 'DESPACHO_PARCIAL', 'DESPACHADO', 'PENDIENTE_DISPONIBILIDAD', 'CANCELADO'
] as const;
/** Tipo «EstadoDespacho»: valores permitidos para estado despacho. */
export type EstadoDespacho = typeof estadosDespacho[number];
/** Modelo de datos «FormulaDespacho» que se intercambia con el backend. */
export interface FormulaDespacho {
  /** Identificador único del registro. */
  id: number;
  /** Fecha (AAAA-MM-DD). */
  fecha: string;
  /** Veterinario. */
  veterinario: string;
  /** Propietario. */
  propietario: string;
  /** Mascota. */
  mascota: string;
  /** Estado actual del registro. */
  estado: EstadoDespacho;
}
/** Modelo de datos «SeleccionLote» que se intercambia con el backend. */
export interface SeleccionLote { medicamento: number; lote: number; cantidad: number }
/** Modelo de datos «LoteDespacho» que se intercambia con el backend. */
export interface LoteDespacho { id: number; numero: string; fechaVence: string | null; cantidad: number }
/** Modelo de datos «MedicamentoDespacho» que se intercambia con el backend. */
export interface MedicamentoDespacho {
  /** Prescripción. */
  prescripcion: {
    medicamento: number; nombre: string; dosis: string; frecuencia: string; duracion: string;
    via: string; indicaciones: string; prescrita: number; entregada: number; pendiente: number;
  };
  /** Lotes del producto. */
  lotes: LoteDespacho[];
  /** Indica si disponible. */
  disponible: number;
}
/** Modelo de datos «PlanDespacho» que se intercambia con el backend. */
export interface PlanDespacho { id: number; lotes: SeleccionLote[] }
/** Modelo de datos «EntregaDespacho» que se intercambia con el backend. */
export interface EntregaDespacho {
  /** Identificador único del registro. */
  id: number;
  /** Formulario reactivo: fórmula. */
  formula: number;
  /** Responsable. */
  responsable: string;
  /** Fecha (AAAA-MM-DD). */
  fecha: string;
  /** Estado actual del registro. */
  estado: EstadoDespacho;
  /** Indica si revertida. */
  revertida: string | null;
  /** Reversor. */
  reversor: string | null;
  /** Motivo registrado. */
  motivo: string | null;
  /** Indica si pendiente. */
  pendiente: string[];
  /** Lineas. */
  lineas: {
    nombre: string; numero: string; cantidad: number; movimiento: number; movimientoReversion: number | null;
  }[];
}
/** Modelo de datos «DetalleDespacho» que se intercambia con el backend. */
export interface DetalleDespacho {
  /** Formulario reactivo: fórmula. */
  formula: FormulaDespacho;
  /** Medicamentos. */
  medicamentos: MedicamentoDespacho[];
  /** Preparacion. */
  preparacion: PlanDespacho | null;
  /** Entregas. */
  entregas: EntregaDespacho[];
  /** Historial. */
  historial: { anterior: EstadoDespacho; nuevo: EstadoDespacho; responsable: string; fecha: string; motivo: string }[];
}

/** Servicio de despacho: consume los endpoints correspondientes de la API REST del backend. */
@Injectable({ providedIn: 'root' })
export class DespachoService {
  /** Dependencia inyectada (HttpClient). */
  private readonly http = inject(HttpClient);
  /** URL base de la API del backend. */
  private readonly base = environment.apiUrlAuth.replace(/\/$/, '') + '/despacho';

  /**
   * Fórmulas mediante la API del backend.
   *
   * @param params parámetros de consulta.
   * @returns observable con la respuesta del backend.
   */
  formulas(params: Record<string, string | number>) {
    return this.http.get<FormulaDespacho[]>(this.base + '/formulas', { params });
  }
  /**
   * Consulta el detalle mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  detalle(id: number) { return this.http.get<DetalleDespacho>(this.base + '/formulas/' + id); }
  /**
   * Prepara despacho mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param clave clave.
   * @param lotes lotes.
   * @returns observable con la respuesta del backend.
   */
  preparar(id: number, clave: string, lotes: SeleccionLote[]) {
    return this.http.post<PlanDespacho>(this.base + '/formulas/' + id + '/preparar', { clave, lotes });
  }
  /**
   * Cambia despacho mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param accion acción.
   * @param motivo motivo indicado por el usuario.
   * @returns observable con la respuesta del backend.
   */
  cambiar(id: number, accion: 'cancelar' | 'disponibilidad', motivo: string) {
    return this.http.post<DetalleDespacho>(this.base + '/formulas/' + id + '/' + accion, { motivo });
  }
  /**
   * Consulta el historial mediante la API del backend.
   *
   * @param params parámetros de consulta.
   * @returns observable con la respuesta del backend.
   */
  historial(params: Record<string, string | number>) {
    return this.http.get<EntregaDespacho[]>(this.base + '/entregas', { params });
  }
  /**
   * Confirma despacho mediante la API del backend.
   *
   * @param id identificador del registro.
   * @returns observable con la respuesta del backend.
   */
  confirmar(id: number) {
    return this.http.post<EntregaDespacho>(this.base + '/entregas/' + id + '/confirmar', null);
  }
  /**
   * Revierte despacho mediante la API del backend.
   *
   * @param id identificador del registro.
   * @param motivo motivo indicado por el usuario.
   * @returns observable con la respuesta del backend.
   */
  revertir(id: number, motivo: string) {
    return this.http.post<EntregaDespacho>(this.base + '/entregas/' + id + '/revertir', { motivo });
  }
  /**
   * Descarga el PDF el dato de la sesión.
   *
   * @param id identificador del registro.
   */
  pdf(id: number) { return this.http.get(this.base + '/entregas/' + id + '/pdf', { responseType: 'blob' }); }
}
