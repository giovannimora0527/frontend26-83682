import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cliente } from './cliente.model';
import { Paciente } from '../pacientes/paciente.model';
/** Consume los endpoints REST de clientes y mascotas por propietario. */
@Injectable({ providedIn: 'root' })
export class ClienteService {
 private readonly url = `${environment.apiUrl}/clientes`;
 constructor(private http: HttpClient) {}
 /** Lista propietarios registrados. */ listar(): Observable<Cliente[]> { return this.http.get<Cliente[]>(this.url); }
 /** Consulta únicamente las mascotas asociadas al cliente seleccionado. */
 mascotas(id: number): Observable<Paciente[]> { return this.http.get<Paciente[]>(`${this.url}/${id}/mascotas`); }
 /** Consulta un propietario por su identificador. */ obtener(id: number): Observable<Cliente> { return this.http.get<Cliente>(`${this.url}/${id}`); }
}
