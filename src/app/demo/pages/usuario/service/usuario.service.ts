import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from 'src/app/models/usuario';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/** Datos que se envían al backend para crear o actualizar un usuario. */
export interface UsuarioRequest {
  id?: number;
  username: string;
  password?: string;
  rol: string;
  email: string;
  activo?: boolean;
}

/** Respuesta genérica del backend ({ status, message }). */
export interface RespuestaBackend {
  status: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private api = `usuario`;

  constructor(private backendService: BackendService) {
    this.testService();
  }

  testService() {
    this.backendService.get(environment.apiUrlAuth, this.api, "test");
  }

  getUsuarios(): Observable<Usuario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  guardarUsuario(usuario: UsuarioRequest): Observable<RespuestaBackend> {
    return this.backendService.post<RespuestaBackend>(environment.apiUrlAuth, this.api, "guardar", usuario);
  }

  actualizarUsuario(usuario: UsuarioRequest): Observable<RespuestaBackend> {
    return this.backendService.post<RespuestaBackend>(environment.apiUrlAuth, this.api, "actualizar", usuario);
  }
}
