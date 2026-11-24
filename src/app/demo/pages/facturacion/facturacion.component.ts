import { SlicePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { descargarClinica, mensajeClinica } from '../../../services/clinica.service';
import { DetalleFactura, Factura, FacturacionService, OrigenFactura, PreviaFactura } from '../../../services/facturacion.service';

@Component({
  selector:'app-facturacion',
  standalone:true,
  imports:[FormsModule, SlicePipe],
  templateUrl:'./facturacion.component.html'
})
export class FacturacionComponent implements OnInit {
  private readonly api=inject(FacturacionService);
  private readonly perfil=inject(AuthService).obtenerPerfil()?.trim().toUpperCase();
  readonly admin=this.perfil==='ADMIN' || this.perfil==='ADMINISTRADOR';
  readonly estados=['PENDIENTE_PAGO','PAGO_PARCIAL','PAGADA','ANULADA'];
  readonly metodos=['EFECTIVO','TARJETA','TRANSFERENCIA','OTRO'];
  vista:'listado'|'emision'='listado';
  filtros={desde:'',hasta:'',propietario:'',mascota:'',estado:''};
  facturas:Factura[]=[];
  atenciones:OrigenFactura[]=[];
  detalle:DetalleFactura|null=null;
  origen:OrigenFactura|null=null;
  previa:PreviaFactura|null=null;
  descuento='0';
  motivoDescuento='';
  motivoAnulacion='';
  abono={importe:'',metodo:'EFECTIVO',referencia:''};
  pagina=0;
  ocupado=false;
  error='';
  aviso='';
  private claveEmision='';
  private intentoPago: {firma:string; clave:string}|null=null;

  ngOnInit() { this.buscar(); }

  cambiar(vista:'listado'|'emision') {
    this.vista=vista;
    this.detalle=null;
    this.origen=null;
    this.previa=null;
    this.buscar();
  }

  buscar(pagina=0) {
    void this.operar(async()=>{
      this.pagina=pagina;
      await this.cargarLista();
    });
  }

  seleccionar(origen:OrigenFactura) {
    this.origen=origen;
    this.previa=null;
    this.descuento='0';
    this.motivoDescuento='';
    this.revisar();
  }

  revisar() {
    const origen=this.origen;
    if(!origen) return;
    void this.operar(async()=>{
      this.previa=null;
      this.previa=await firstValueFrom(this.api.previa(origen.id,this.descuento,this.motivoDescuento));
      this.claveEmision=crypto.randomUUID();
    });
  }

  emitir() {
    const previa=this.previa;
    if(!previa || !confirm('¿Emitir la factura con los conceptos e importes de la vista previa?')) return;
    void this.operar(async()=>{
      this.detalle=await firstValueFrom(this.api.emitir(previa.origen.id,this.claveEmision,previa.huella,
        this.descuento,this.motivoDescuento));
      this.aviso='Factura emitida.';
      this.previa=null;
      this.origen=null;
      this.vista='listado';
      this.pagina=0;
      await this.cargarLista();
    });
  }

  abrir(id:number) {
    void this.operar(async()=>{
      this.detalle=await firstValueFrom(this.api.detalle(id));
      this.abono={importe:'',metodo:'EFECTIVO',referencia:''};
      this.motivoAnulacion='';
    });
  }

  pagar() {
    const f=this.detalle?.factura;
    if(!f) return;
    if(!/^\d{1,17}(\.\d{1,2})?$/.test(this.abono.importe) || !/[1-9]/.test(this.abono.importe)) {
      this.error='Indica un importe mayor que cero con hasta dos decimales.';
      return;
    }
    const datos={...this.abono,saldoEsperado:f.saldo};
    const firma=JSON.stringify([f.id,datos]);
    if(this.intentoPago?.firma!==firma) this.intentoPago={firma,clave:crypto.randomUUID()};
    const clave=this.intentoPago.clave;
    void this.operar(async()=>{
      this.detalle=await firstValueFrom(this.api.pagar(f.id,{...datos,clave}));
      this.aviso='Pago registrado.';
      this.abono.importe='';
      this.abono.referencia='';
      this.intentoPago=null;
      await this.cargarLista();
    });
  }

  anular() {
    const f=this.detalle?.factura;
    if(!f || !this.motivoAnulacion.trim() || !confirm('¿Anular esta factura?')) return;
    void this.operar(async()=>{
      this.detalle=await firstValueFrom(this.api.anular(f.id,this.motivoAnulacion));
      this.aviso='Factura anulada.';
      await this.cargarLista();
    });
  }

  pdf(id:number) {
    void this.operar(async()=>descargarClinica(await firstValueFrom(this.api.pdf(id)),'factura-'+id+'.pdf'));
  }

  etiqueta(estado:string) { return estado.toLowerCase().replaceAll('_',' '); }

  private async cargarLista() {
    if(this.vista==='emision') {
      this.atenciones=await firstValueFrom(this.api.elegibles(this.pagina));
      return;
    }
    const params=Object.fromEntries(Object.entries(this.filtros).filter(([,v])=>v.trim()));
    this.facturas=await firstValueFrom(this.api.listar({...params,pagina:this.pagina}));
  }

  private async operar(accion:()=>Promise<void>) {
    if(this.ocupado) return;
    this.ocupado=true;
    this.error='';
    this.aviso='';
    try { await accion(); }
    catch(e) {
      const fallo=e as {error?:unknown;status?:number};
      this.error=await mensajeClinica(fallo);
      if(fallo.status===409) this.error+=' Actualiza la información y vuelve a revisar.';
    } finally { this.ocupado=false; }
  }
}
