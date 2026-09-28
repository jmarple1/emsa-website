import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';

const sameAsNew = (g: AbstractControl): ValidationErrors | null =>
  g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true };

// The signed-in officer's own account: change password.
@Component({
  selector: 'app-account',
  imports: [ReactiveFormsModule],
  templateUrl: './account.html',
})
export class Account {
  private readonly api = inject(ApiService);
  protected readonly auth = inject(AuthService);

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      current: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(200)]],
      confirm: ['', Validators.required],
    },
    { validators: sameAsNew },
  );
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly done = signal(false);
  readonly error = signal('');
  readonly serverErrors = signal<Record<string, string>>({});

  fieldError(name: 'current' | 'password' | 'confirm'): string {
    const server = this.serverErrors()[name];
    if (server) return server;
    if (!this.submitted()) return '';
    const c = this.form.controls[name];
    if (name === 'current' && c.invalid) return 'Enter your current password.';
    if (name === 'password' && c.invalid) return 'Use at least 12 characters.';
    if (name === 'confirm' && c.invalid) return 'Enter the new password again.';
    if (name === 'confirm' && this.form.hasError('mismatch')) return "The two new passwords don't match.";
    return '';
  }

  save(): void {
    this.submitted.set(true);
    this.serverErrors.set({});
    this.error.set('');
    this.done.set(false);
    if (this.form.invalid) return;
    const { current, password } = this.form.getRawValue();
    this.saving.set(true);
    this.api.changePassword(current, password).subscribe({
      next: () => {
        this.saving.set(false);
        this.submitted.set(false);
        this.form.reset();
        this.done.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        if (e.status === 400 && e.error?.fields) this.serverErrors.set(e.error.fields);
        else if (e.status === 429) this.error.set('Too many tries. Wait a minute and try again.');
        else this.error.set("Couldn't change the password. Please try again.");
      },
    });
  }
}
