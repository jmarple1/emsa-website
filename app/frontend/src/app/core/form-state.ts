import { signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { SubmitResult } from './api.service';

type Messages = Record<string, Record<string, string>>;

/**
 * Shared behavior for the public forms: client-side validation messages,
 * per-field errors from the API ({"fields": {...}}), an aria-live status
 * message, and moving focus to the first field that needs fixing.
 */
export class FormState {
  readonly status = signal<'idle' | 'sending' | 'done' | 'error'>('idle');
  readonly message = signal('');
  private submitted = false;

  constructor(
    readonly form: FormGroup,
    private readonly messages: Messages,
    private readonly formId: string,
  ) {}

  /** Error text for a field, or null when it's fine (or untouched). */
  error(name: string): string | null {
    const c = this.form.get(name);
    if (!c || c.valid || !(c.touched || this.submitted)) return null;
    const errors = c.errors ?? {};
    if (errors['server']) return errors['server'];
    const key = Object.keys(errors)[0];
    return this.messages[name]?.[key] ?? 'Check this field.';
  }

  /** Validates, sends, and shows the result. `after` runs once the server answers (success or error). */
  submit(send: (value: any) => Observable<SubmitResult>, after?: () => void): void {
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.status.set('error');
      this.message.set('Please fix the highlighted fields.');
      this.focusFirstInvalid();
      return;
    }
    this.status.set('sending');
    this.message.set('');
    send(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.status.set('done');
        this.message.set(r.message);
        this.submitted = false;
        this.form.reset();
        this.showResult();
        after?.();
      },
      error: (e: HttpErrorResponse) => {
        this.status.set('error');
        const fields = e.error?.fields as Record<string, string> | undefined;
        if (fields) {
          for (const [name, msg] of Object.entries(fields)) {
            this.form.get(name)?.setErrors({ server: msg });
          }
          this.focusFirstInvalid();
        } else {
          this.showResult();
        }
        this.message.set(
          e.error?.error ??
            (e.status === 0
              ? "We couldn't reach the server. Check your connection and try again."
              : 'Something went wrong. Please try again.'),
        );
        after?.();
      },
    });
  }

  /** The result message sits under a long form; bring it on screen and focus it. */
  private showResult(): void {
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`#${this.formId} .form-status`);
      if (!el) return;
      el.tabIndex = -1;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  private focusFirstInvalid(): void {
    // Wait a tick so error messages render before focus moves.
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(
        `#${this.formId} [aria-invalid="true"], #${this.formId} fieldset[aria-invalid="true"] input`,
      );
      el?.focus();
    });
  }
}
