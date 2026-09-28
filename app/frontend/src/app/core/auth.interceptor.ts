import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

// Adds the officer's token to /api/admin/* requests only, and signs the
// officer out (with an "expired" notice) when the server rejects the token.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (!req.url.startsWith('/api/admin/')) return next(req);

  const token = auth.token();
  if (token) req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      if (e.status === 401) auth.expire();
      return throwError(() => e);
    }),
  );
};
