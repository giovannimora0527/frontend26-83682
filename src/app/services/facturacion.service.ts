import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type Dinero = string | number;
export type EstadoFactura = 'PENDIENTE_PAGO' | 'PAGO_PARCIAL' | 'PAGADA' | 'ANULADA';

export interface OrigenFactura {
  id: number;
  cita: number;
  propietario: string;
  mascota: string;
  veterinario: string;
  especialidad: string;
}
export interface ImportesFactura { subtotal: Dinero; descuento: Dinero; iva: Dinero; otros: Dinero; total: Dinero }
export interface PreviaFactura {
  origen: OrigenFactura;
  huella: string;
  importes: ImportesFactura;
  lineas: { origen: { servicio: number | null; movimiento: number | null; nombre: string; cantidad: number; precio: Dinero };
    importes: ImportesFactura }[];
}
export interface Factura {
  id: number; numero: string; atencion: number; cita: number; emitida: string; propietario: string; mascota: string;
  veterinario: string; especialidad: string; subtotal: Dinero; descuento: Dinero; iva: Dinero; otros_impuestos: Dinero;
  total: Dinero; pagado: Dinero; saldo: Dinero; estado: EstadoFactura; responsable: string;
}
export interface DetalleFactura {
  factura: Factura;
  lineas: { id: number; servicio_id: number | null; concepto: string; cantidad: number; precio_unitario: Dinero;
    subtotal: Dinero; descuento: Dinero; iva: Dinero; otros_impuestos: Dinero; total: Dinero }[];
  pagos: { id: number; fecha: string; importe: Dinero; metodo: string; referencia: string | null; responsable: string; estado: string }[];
  historial: { id: number; anterior: EstadoFactura | null; nuevo: EstadoFactura; fecha: string; motivo: string | null; responsable: string }[];
}

@Injectable({providedIn: 'root'})
export class FacturacionService {
  private readonly http=inject(HttpClient);
  private readonly base=environment.apiUrlAuth+'/facturacion';

  listar(params: Record<string,string|number>) {
    return this.http.get<Factura[]>(this.base+'/facturas',{params});
  }
  elegibles(pagina: number) {
    return this.http.get<OrigenFactura[]>(this.base+'/atenciones',{params:{pagina}});
  }
  previa(id: number, descuento: string, motivo: string) {
    return this.http.post<PreviaFactura>(this.base+'/atenciones/'+id+'/previa',{descuento,motivo});
  }
  emitir(id: number, clave: string, previa: string, descuento: string, motivo: string) {
    return this.http.post<DetalleFactura>(this.base+'/atenciones/'+id+'/facturas',{clave,previa,descuento,motivo});
  }
  detalle(id: number) { return this.http.get<DetalleFactura>(this.base+'/facturas/'+id); }
  pagar(id: number, pago: {clave: string; importe: string; saldoEsperado: Dinero; metodo: string; referencia: string}) {
    return this.http.post<DetalleFactura>(this.base+'/facturas/'+id+'/pagos',pago);
  }
  anular(id: number, motivo: string) {
    return this.http.post<DetalleFactura>(this.base+'/facturas/'+id+'/anular',{motivo});
  }
  pdf(id: number) { return this.http.get(this.base+'/facturas/'+id+'/pdf',{responseType:'blob'}); }
}
