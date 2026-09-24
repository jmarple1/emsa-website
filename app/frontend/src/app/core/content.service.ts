import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface SiteLink {
  label: string;
  url: string;
}

/**
 * Officer-edited text blocks (site_settings, edited at /admin → Site content).
 * Everything here is plain text: pages render it with {{ }} interpolation,
 * which escapes it, so an officer can't inject HTML. When a block is empty
 * the page shows its original placeholder.
 */
@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly api = inject(ApiService);
  private readonly data = signal<Record<string, string>>({});
  private loaded = false;

  load(force = false): void {
    if (this.loaded && !force) return;
    this.loaded = true;
    this.api.content().subscribe({ next: (d) => this.data.set(d ?? {}), error: () => {} });
  }

  get(key: string): string | null {
    const v = this.data()[key]?.trim();
    return v ? v : null;
  }

  /** One item per non-empty line. */
  lines(key: string): string[] {
    return (this.get(key) ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  }

  /** Paragraphs separated by blank lines. */
  paragraphs(key: string): string[] {
    return (this.get(key) ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  }

  /** "Label | https://..." lines. Anything that isn't https:// is dropped. */
  links(key: string): SiteLink[] {
    return this.lines(key)
      .map((l) => {
        const i = l.indexOf('|');
        return i < 0 ? null : { label: l.slice(0, i).trim(), url: l.slice(i + 1).trim() };
      })
      .filter((x): x is SiteLink => !!x && !!x.label && /^https:\/\/\S+$/.test(x.url));
  }

  /** "Name | Role" lines. */
  people(key: string): { name: string; role: string }[] {
    return this.lines(key)
      .map((l) => {
        const i = l.indexOf('|');
        return i < 0 ? null : { name: l.slice(0, i).trim(), role: l.slice(i + 1).trim() };
      })
      .filter((x): x is { name: string; role: string } => !!x && !!x.name && !!x.role);
  }

  /** A single https:// URL, or null. */
  url(key: string): string | null {
    const v = this.get(key);
    return v && /^https:\/\/\S+$/.test(v) ? v : null;
  }
}
