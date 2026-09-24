import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService, ImpactStat } from '../../../core/api.service';
import { ContentService } from '../../../core/content.service';
import { ImpactService } from '../../../core/impact.service';
import { CONTENT_BLOCKS, ContentBlock } from '../content-blocks';

interface BlockState { value: string; saved: string; status: '' | 'saving' | 'saved' | 'error'; error: string }
interface ImpactState { value: number; saved: number; status: '' | 'saving' | 'saved' | 'error'; error: string }

// Where each impact number shows (brief section 7).
const IMPACT_WHERE: Record<string, string> = {
  cpr_certified: 'Home, About',
  stop_the_bleed: 'Home, About, What We Do, CPR Classes',
  narcan_kits: 'Home, About, What We Do, Naloxone',
  test_strips: 'Home, About, What We Do, Naloxone',
  condoms: 'What We Do, Naloxone',
  frat_houses: 'Home, About, What We Do, Naloxone',
  members: 'About',
};

@Component({
  selector: 'app-content-editor',
  imports: [FormsModule, RouterLink],
  templateUrl: './content-editor.html',
})
export class ContentEditor {
  private readonly api = inject(ApiService);
  private readonly content = inject(ContentService);
  private readonly impactService = inject(ImpactService);

  readonly blocks = CONTENT_BLOCKS;
  readonly state = signal<Record<string, BlockState>>({});
  readonly impact = signal<ImpactStat[]>([]);
  readonly impactState = signal<Record<string, ImpactState>>({});
  readonly where = IMPACT_WHERE;

  constructor() {
    this.api.adminContent().subscribe((c) => {
      const s: Record<string, BlockState> = {};
      for (const b of this.blocks) s[b.key] = { value: c?.[b.key] ?? '', saved: c?.[b.key] ?? '', status: '', error: '' };
      this.state.set(s);
    });
    this.api.impact().subscribe((rows) => {
      this.impact.set(rows);
      const s: Record<string, ImpactState> = {};
      for (const r of rows) s[r.key] = { value: r.value, saved: r.value, status: '', error: '' };
      this.impactState.set(s);
    });
  }

  private patch<T>(sig: typeof this.state | typeof this.impactState, key: string, change: Partial<T>): void {
    (sig as any).update((s: Record<string, T>) => ({ ...s, [key]: { ...s[key], ...change } }));
  }

  changed(b: ContentBlock): boolean {
    const s = this.state()[b.key];
    return !!s && s.value.trim() !== s.saved.trim();
  }

  saveBlock(b: ContentBlock): void {
    const value = this.state()[b.key].value;
    this.patch<BlockState>(this.state, b.key, { status: 'saving', error: '' });
    this.api.saveContent(b.key, value).subscribe({
      next: () => {
        this.patch<BlockState>(this.state, b.key, { status: 'saved', saved: value.trim(), value: value.trim() });
        this.content.load(true);
      },
      error: (e: HttpErrorResponse) =>
        this.patch<BlockState>(this.state, b.key, { status: 'error', error: e.error?.fields?.value ?? e.error?.error ?? 'Could not save.' }),
    });
  }

  clearBlock(b: ContentBlock): void {
    this.patch<BlockState>(this.state, b.key, { value: '' });
    this.saveBlock(b);
  }

  edit(b: ContentBlock, value: string): void {
    this.patch<BlockState>(this.state, b.key, { value, status: '' });
  }

  impactChanged(key: string): boolean {
    const s = this.impactState()[key];
    return !!s && Number(s.value) !== s.saved;
  }

  editImpact(key: string, value: number): void {
    this.patch<ImpactState>(this.impactState, key, { value, status: '' });
  }

  saveImpact(key: string): void {
    const value = Number(this.impactState()[key].value);
    this.patch<ImpactState>(this.impactState, key, { status: 'saving', error: '' });
    this.api.saveImpact(key, value).subscribe({
      next: () => {
        this.patch<ImpactState>(this.impactState, key, { status: 'saved', saved: value });
        this.impactService.load(true);
      },
      error: (e: HttpErrorResponse) =>
        this.patch<ImpactState>(this.impactState, key, { status: 'error', error: e.error?.fields?.value ?? 'Could not save.' }),
    });
  }

  preview(stat: ImpactStat): string {
    const v = Number(this.impactState()[stat.key]?.value ?? stat.value);
    return `${Number.isFinite(v) ? v.toLocaleString('en-US') : '?'}${stat.suffix} ${stat.label}`;
  }
}
