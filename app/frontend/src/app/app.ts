import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  template: `
    <a class="skip-link" href="#main" (click)="skipToMain($event)">Skip to main content</a>
    <app-header />
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
  `,
})
export class App {
  private readonly router = inject(Router);

  constructor() {
    // After moving to a new page, put keyboard/screen-reader focus at the
    // top of the new content (unless the link targets a section).
    let first = true;
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (first) { first = false; return; }
      if (this.router.parseUrl(this.router.url).fragment) return;
      setTimeout(() => document.getElementById('main')?.focus({ preventScroll: true }));
    });
  }

  skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
