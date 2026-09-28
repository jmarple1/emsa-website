import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';

// Site header: one shared component (replaces the header copied onto every
// static page). The phone menu is a real toggle button with aria-expanded.
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
})
export class Header {
  readonly open = signal(false);

  readonly links = [
    { path: '/', label: 'Home' },
    { path: '/what-we-do', label: 'What We Do' },
    { path: '/cpr-classes', label: 'CPR Classes' },
    { path: '/naloxone', label: 'Naloxone' },
    { path: '/events', label: 'Events' },
    { path: '/about', label: 'About' },
    { path: '/faq', label: 'FAQ' },
    { path: '/contact', label: 'Contact' },
  ];

  constructor() {
    inject(Router).events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.open.set(false));
  }

  toggle(): void {
    this.open.update((v) => !v);
  }
}
