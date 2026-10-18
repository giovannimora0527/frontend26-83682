import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';


@Injectable()
export class HeadersInterceptor implements HttpInterceptor {

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    if (!req.body || req.body instanceof FormData || req.headers.has('Content-Type')) {
      return next.handle(req);
    }
    return next.handle(req.clone({ setHeaders: { 'Content-Type': 'application/json' } }));
  }

  addHeaders(request: HttpRequest<unknown>): HttpRequest<unknown> {
    if (!request.body || request.body instanceof FormData || request.headers.has('Content-Type')) return request;
    return request.clone({ setHeaders: { 'Content-Type': 'application/json' } });
  }
}
