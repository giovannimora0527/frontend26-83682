import { HttpParams } from '@angular/common/http';

export function queryParams(values: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values) as [string, unknown][]) {
    if ((typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
