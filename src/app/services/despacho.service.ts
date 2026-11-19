import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const estadosDespacho = [
  'PENDIENTE_DESPACHO', 'EN_PREPARACION', 'DESPACHO_PARCIAL', 'DESPACHADO', 'PENDIENTE_DISPONIBILIDAD', 'CANCELADO'
] as const;
export type EstadoDespacho = typeof estadosDespacho[number];
export interface FormulaDespacho {
  id: number;
  fecha: string;
  veterinario: string;
  propietario: string;
  mascota: string;
  estado: EstadoDespacho;
}
export interface SeleccionLote { medicamento: number; lote: number; cantidad: number }
export interface LoteDespacho { id: number; numero: string; fechaVence: string | null; cantidad: number }
export interface MedicamentoDespacho {
  prescripcion: {
    medicamento: number; nombre: string; dosis: string; frecuencia: string; duracion: string;
    via: string; indicaciones: string; prescrita: number; entregada: number; pendiente: number;
  };
  lotes: LoteDespacho[];
  disponible: number;
}
export interface PlanDespacho { id: number; lotes: SeleccionLote[] }
export interface EntregaDespacho {
  id: number;
  formula: number;
  responsable: string;
  fecha: string;
  estado: EstadoDespacho;
  revertida: string | null;
  reversor: string | null;
  motivo: string | null;
  pendiente: string[];
  lineas: {
    nombre: string; numero: string; cantidad: number; movimiento: number; movimientoReversion: number | null;
  }[];
}
export interface DetalleDespacho {
  formula: FormulaDespacho;
  medicamentos: MedicamentoDespacho[];
  preparacion: PlanDespacho | null;
  entregas: EntregaDespacho[];
  historial: { anterior: EstadoDespacho; nuevo: EstadoDespacho; responsable: string; fecha: string; motivo: string }[];
}

@Injectable({ providedIn: 'root' })
export class DespachoService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrlAuth.replace(/\/$/, '') + '/despacho';

  formulas(params: Record<string, string | number>) {
    return this.http.get<FormulaDespacho[]>(this.base + '/formulas', { params });
  }
  detalle(id: number) { return this.http.get<DetalleDespacho>(this.base + '/formulas/' + id); }
  preparar(id: number, clave: string, lotes: SeleccionLote[]) {
    return this.http.post<PlanDespacho>(this.base + '/formulas/' + id + '/preparar', { clave, lotes });
  }
  cambiar(id: number, accion: 'cancelar' | 'disponibilidad', motivo: string) {
    return this.http.post<DetalleDespacho>(this.base + '/formulas/' + id + '/' + accion, { motivo });
  }
  historial(params: Record<string, string | number>) {
    return this.http.get<EntregaDespacho[]>(this.base + '/entregas', { params });
  }
  confirmar(id: number) {
    return this.http.post<EntregaDespacho>(this.base + '/entregas/' + id + '/confirmar', null);
  }
  revertir(id: number, motivo: string) {
    return this.http.post<EntregaDespacho>(this.base + '/entregas/' + id + '/revertir', { motivo });
  }
  pdf(id: number) { return this.http.get(this.base + '/entregas/' + id + '/pdf', { responseType: 'blob' }); }
}
