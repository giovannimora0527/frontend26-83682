import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private apiCita = 'cita';
  private apiCliente = 'cliente';
  private apiMascota = 'mascota';
  private apiMedico = 'medico';

  constructor(private backendService: BackendService) { }

  listarCitas(): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiCita, "listar");
  }

  crearCita(cita: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.apiCita, "crear", cita);
  }

  actualizarCita(cita: any): Observable<any> {
    return this.backendService.post(environment.apiUrlAuth, this.apiCita, "actualizar", cita);
  }

  listarClientes(): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiCliente, "listar");
  }

  listarMascotasPorCliente(clienteId: number): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiMascota, `buscar-by-cliente?clienteId=${clienteId}`);
  }

  listarMedicos(): Observable<any[]> {
    return this.backendService.get(environment.apiUrlAuth, this.apiMedico, "listar");
  }
}