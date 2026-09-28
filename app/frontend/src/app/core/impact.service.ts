import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';

// Impact numbers (brief section 7), ONE source for Home, About, What We Do,
// Naloxone, and CPR Classes. These fallbacks are what the pages show if the
// API is unreachable; the database copy (impact_stats) wins when it loads.
const FALLBACK: Record<string, { value: number; suffix: string }> = {
  cpr_certified: { value: 76, suffix: '+' },
  stop_the_bleed: { value: 30, suffix: '' },
  narcan_kits: { value: 200, suffix: '' },
  test_strips: { value: 2000, suffix: '' },
  condoms: { value: 500, suffix: '' },
  frat_houses: { value: 25, suffix: '' },
  members: { value: 60, suffix: '+' },
};

@Injectable({ providedIn: 'root' })
export class ImpactService {
  private readonly api = inject(ApiService);
  private readonly stats = signal(FALLBACK);
  private loaded = false;

  /** Starts loading once; call from any page that shows numbers. `force` reloads (after an officer edit). */
  load(force = false): void {
    if (this.loaded && !force) return;
    this.loaded = true;
    this.api.impact().subscribe({
      next: (rows) => {
        const next = { ...FALLBACK };
        for (const r of rows) next[r.key] = { value: r.value, suffix: r.suffix };
        this.stats.set(next);
      },
      error: () => { /* keep the fallback numbers */ },
    });
  }

  /** Display string, e.g. "76+" or "2,000". */
  fmt(key: string): string {
    const s = this.stats()[key];
    return s ? s.value.toLocaleString('en-US') + s.suffix : '';
  }
}
