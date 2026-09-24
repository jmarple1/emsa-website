import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Header } from './shared/header/header';
import { Footer } from './shared/footer/footer';
import { ApiService } from './core/api.service';

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
  private readonly api = inject(ApiService);

  constructor() {
    let first = true;
    let lastCounted = '';
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      // Count the page view once per page (not for #section jumps within it).
      const segments = this.router.parseUrl(this.router.url).root.children['primary']?.segments ?? [];
      const path = '/' + segments.map((s) => s.path).join('/');
      if (path !== lastCounted) {
        lastCounted = path;
        this.countView(path);
      }
      // After moving to a new page, put keyboard/screen-reader focus at the
      // top of the new content (unless the link targets a section).
      if (first) { first = false; return; }
      if (this.router.parseUrl(this.router.url).fragment) return;
      setTimeout(() => document.getElementById('main')?.focus({ preventScroll: true }));
    });
  }

  /** Privacy-respecting visit count: skipped for officers and for browsers that opt out. */
  private countView(path: string): void {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (path.startsWith('/admin') || nav.doNotTrack === '1' || nav.globalPrivacyControl) return;
    this.api.pageView(path).subscribe({ error: () => {} });
  }

  skipToMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
