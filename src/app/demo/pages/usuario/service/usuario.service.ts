import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Perfil } from 'src/app/models/perfil';
import { Usuario, UsuarioRq } from 'src/app/models/usuario';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private api = 'usuario';

  constructor(private readonly backendService: BackendService) { }

  listarUsuarios(): Observable<Usuario[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-ordenado');
  }

  /** La entidad del backend identifica el perfil con perfilId; se admite también id. */
  listarPerfiles(): Observable<Perfil[]> {
    return this.backendService
      .get<(Omit<Perfil, 'id'> & { id?: number; perfilId?: number })[]>(environment.apiUrlAuth, 'perfil', 'listar')
      .pipe(map((perfiles) => perfiles.flatMap(({ id, perfilId, codigo, nombre }) => {
        const identificador = id ?? perfilId;
        return identificador === undefined ? [] : [{ id: identificador, codigo, nombre }];
      })));
  }

  crearUsuario(usuario: UsuarioRq): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', usuario);
  }

  actualizarUsuario(usuario: UsuarioRq & { id: number }): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'actualizar', usuario);
  }

  cambiarEstado(id: number, activo: boolean): Observable<unknown> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { activo });
  }
}
