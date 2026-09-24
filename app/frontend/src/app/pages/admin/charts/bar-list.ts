import { Component, computed, input, signal } from '@angular/core';

export interface BarDatum {
  label: string;
  value: number;
}

// Single-series horizontal bars (HTML). Value at the bar tip; hover or focus
// lifts the bar and adds its share of the total. At most 24px thick, 4px
// rounded data-end, square at the baseline.
@Component({
  selector: 'app-bar-list',
  template: `
    <ul class="viz-bars">
      @for (d of data(); track d.label) {
        <li class="viz-bar-row" tabindex="0" [class.is-hover]="hover() === d.label"
            [attr.aria-label]="d.label + ': ' + d.value + ' (' + share(d) + ')'"
            (pointerenter)="hover.set(d.label)" (pointerleave)="hover.set(null)"
            (focus)="hover.set(d.label)" (blur)="hover.set(null)">
          <span class="viz-bar-label">{{ d.label }}</span>
          <span class="viz-bar-track">
            <span class="viz-bar" [style.width]="'calc(' + pct(d) + '% * 0.8)'"></span>
            <span class="viz-bar-value">{{ d.value.toLocaleString('en-US') }}@if (hover() === d.label) {<span class="viz-bar-share"> · {{ share(d) }}</span>}</span>
          </span>
        </li>
      }
    </ul>
  `,
})
export class BarList {
  readonly data = input.required<BarDatum[]>();
  readonly hover = signal<string | null>(null);

  private readonly max = computed(() => Math.max(1, ...this.data().map((d) => d.value)));
  private readonly total = computed(() => this.data().reduce((s, d) => s + d.value, 0));

  pct(d: BarDatum): number {
    return (d.value / this.max()) * 100;
  }

  share(d: BarDatum): string {
    return this.total() ? `${Math.round((d.value / this.total()) * 100)}% of total` : '0% of total';
  }
}
