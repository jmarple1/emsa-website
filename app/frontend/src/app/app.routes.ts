import { Routes } from '@angular/router';
import meta from './page-meta.json';

// Titles and meta descriptions are copied verbatim from the static pages
// (page-meta.json). PageTitleStrategy applies both on every navigation.
const page = (key: keyof typeof meta) => ({
  title: meta[key].title,
  data: { description: meta[key].description },
});

export const routes: Routes = [
  { path: '', ...page('home'), loadComponent: () => import('./pages/home/home').then((m) => m.Home) },
  { path: 'what-we-do', ...page('what-we-do'), loadComponent: () => import('./pages/what-we-do/what-we-do').then((m) => m.WhatWeDo) },
  { path: 'join', ...page('join'), loadComponent: () => import('./pages/join/join').then((m) => m.Join) },
  { path: 'cpr-classes', ...page('cpr-classes'), loadComponent: () => import('./pages/cpr-classes/cpr-classes').then((m) => m.CprClasses) },
  { path: 'naloxone', ...page('naloxone'), loadComponent: () => import('./pages/naloxone/naloxone').then((m) => m.Naloxone) },
  { path: 'emergency', ...page('emergency'), loadComponent: () => import('./pages/emergency/emergency').then((m) => m.Emergency) },
  { path: 'events', ...page('events'), loadComponent: () => import('./pages/events/events').then((m) => m.Events) },
  { path: 'about', ...page('about'), loadComponent: () => import('./pages/about/about').then((m) => m.About) },
  { path: 'faq', ...page('faq'), loadComponent: () => import('./pages/faq/faq').then((m) => m.Faq) },
  { path: 'contact', ...page('contact'), loadComponent: () => import('./pages/contact/contact').then((m) => m.Contact) },
  { path: 'privacy', ...page('privacy'), loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy) },
  {
    path: 'admin',
    title: 'Officer sign-in | EMS Alliance (EMSA)',
    data: { description: 'Officer sign-in for EMS Alliance.' },
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
  },
  // Old static URLs (index.html, join.html, ...) keep working.
  { path: 'index.html', redirectTo: '' },
  ...(['what-we-do', 'join', 'cpr-classes', 'naloxone', 'emergency', 'events', 'about', 'faq', 'contact'] as const).map(
    (p) => ({ path: `${p}.html`, redirectTo: p }),
  ),
  {
    path: '**',
    title: 'Page not found | EMS Alliance (EMSA)',
    data: { description: 'This page does not exist.' },
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound),
  },
];
