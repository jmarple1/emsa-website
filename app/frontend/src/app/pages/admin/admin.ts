import { Component, OnDestroy, ViewEncapsulation, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ClassesEditor } from './classes-editor/classes-editor';
import { ContentEditor } from './content-editor/content-editor';
import { EventsEditor } from './events-editor/events-editor';
import { Overview } from './overview/overview';
import { Submissions } from './submissions/submissions';

type Tab = 'overview' | 'classes' | 'events' | 'content' | 'submissions';

// Officer dashboard: sign-in, then Overview (charts), editors for classes,
// events, and site content, and the form submissions.
@Component({
  selector: 'app-admin',
  imports: [ReactiveFormsModule, Overview, ClassesEditor, EventsEditor, ContentEditor, Submissions],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  // Admin-only styles, loaded with this lazy chunk and scoped under .admin.
  encapsulation: ViewEncapsulation.None,
})
export class Admin implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly meta = inject(Meta);
  protected readonly auth = inject(AuthService);

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'classes', label: 'Classes' },
    { key: 'events', label: 'Events' },
    { key: 'content', label: 'Site content' },
    { key: 'submissions', label: 'Submissions' },
  ];
  readonly tab = signal<Tab>('overview');
  readonly loginError = signal('');
  readonly signingIn = signal(false);

  readonly login = inject(FormBuilder).nonNullable.group({
    // Officers sign in with a username or an email (officers.email holds either).
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag('name="robots"');
  }

  signIn(): void {
    if (this.login.invalid) {
      this.loginError.set('Enter your username and password.');
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
        this.tab.set('overview');
      },
      error: (e: HttpErrorResponse) => {
        this.signingIn.set(false);
        this.loginError.set(
          e.status === 401 ? 'Wrong username or password.' : (e.error?.error ?? 'Sign-in failed. Please try again.'),
        );
      },
    });
  }

  signOut(): void {
    this.auth.signOut();
  }
}
