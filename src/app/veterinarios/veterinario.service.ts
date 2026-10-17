import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Veterinario } from './veterinario.model';
/** Consume la API REST de veterinarios. */
@Injectable({ providedIn: 'root' })
export class VeterinarioService {
 private readonly url = `${environment.apiUrl}/veterinarios`;
 constructor(private http: HttpClient) {}
 /** Lista los profesionales; el formulario filtra los que están activos. */ listar(): Observable<Veterinario[]> { return this.http.get<Veterinario[]>(this.url); }
 /** Consulta un profesional por id. */ obtener(id: number): Observable<Veterinario> { return this.http.get<Veterinario>(`${this.url}/${id}`); }
}
