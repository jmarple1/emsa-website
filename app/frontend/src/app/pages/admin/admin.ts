import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminTable, ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

// Officer area (phase 1: read-only). Sign in, view each form's submissions,
// and download them as CSV for Google Sheets or Excel.
@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './admin.html',
})
export class Admin {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  readonly tabs = [
    { key: 'join', label: 'Join interest forms' },
    { key: 'registrations', label: 'Class registrations' },
    { key: 'group-requests', label: 'Group class requests' },
    { key: 'naloxone', label: 'Naloxone requests' },
  ];
  readonly current = signal('join');
  readonly table = signal<AdminTable | null>(null);
  readonly loadError = signal('');
  readonly loginError = signal('');
  readonly signingIn = signal(false);

  readonly login = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.auth.token()) this.show('join');
  }

  signIn(): void {
    if (this.login.invalid) {
      this.loginError.set('Enter your email and password.');
      return;
    }
    this.signingIn.set(true);
    this.loginError.set('');
    const { email, password } = this.login.getRawValue();
    this.api.login(email, password).subscribe({
      next: (r) => {
        this.signingIn.set(false);
        this.auth.signIn(r.token, r.name, r.email);
        this.login.reset();
        this.show('join');
      },
      error: (e: HttpErrorResponse) => {
        this.signingIn.set(false);
        this.loginError.set(e.error?.error ?? 'Sign-in failed. Please try again.');
      },
    });
  }

  signOut(): void {
    this.auth.signOut();
    this.table.set(null);
  }

  show(key: string): void {
    this.current.set(key);
    this.table.set(null);
    this.loadError.set('');
    this.api.adminTable(key).subscribe({
      next: (t) => this.table.set(t),
      error: (e: HttpErrorResponse) => this.handleError(e),
    });
  }

  download(): void {
    const key = this.current();
    this.api.adminCsv(key).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emsa-${key}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (e: HttpErrorResponse) => this.handleError(e),
    });
  }

  label(column: string): string {
    return column.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  }

  private handleError(e: HttpErrorResponse): void {
    if (e.status === 401) {
      this.auth.signOut();
      this.loginError.set('Your session expired. Please sign in again.');
      return;
    }
    this.loadError.set("Couldn't load this list. Please try again.");
  }
}
