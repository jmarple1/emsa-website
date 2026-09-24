import { Component, ElementRef, OnDestroy, afterNextRender, computed, inject, input, signal } from '@angular/core';

export interface ColumnDatum {
  label: string; // x-axis label, e.g. "Sep 21"
  tip: string;   // tooltip / screen-reader text, e.g. "Week of Sep 21"
  value: number;
}

// Single-series column chart (SVG). Specs from the dataviz method: columns
// at most 24px wide with a 4px rounded top and a square base, hairline solid
// gridlines, clean integer ticks, and a hover/focus tooltip on every column.
@Component({
  selector: 'app-column-chart',
  template: `
    <div class="viz-plot" (pointerleave)="hover.set(null)">
      <svg [attr.width]="width()" [attr.height]="H" role="img" [attr.aria-label]="summary()">
        @for (t of scale().ticks; track t) {
          <line class="viz-grid" [attr.x1]="M.l" [attr.x2]="width() - M.r" [attr.y1]="y(t)" [attr.y2]="y(t)" />
          <text class="viz-tick" [attr.x]="M.l - 8" [attr.y]="y(t) + 4" text-anchor="end">{{ t.toLocaleString('en-US') }}</text>
        }
        <line class="viz-axis" [attr.x1]="M.l" [attr.x2]="width() - M.r" [attr.y1]="y(0)" [attr.y2]="y(0)" />
        @for (b of bars(); track $index) {
          @if (b.h > 0) {
            <path class="viz-col" [class.is-hover]="hover() === $index" [attr.d]="b.path" />
          }
          @if ($index % labelEvery() === 0) {
            <text class="viz-tick" [attr.x]="b.cx" [attr.y]="H - 8" text-anchor="middle">{{ b.label }}</text>
          }
        }
        @for (b of bars(); track $index) {
          <rect class="viz-hit" [attr.x]="b.bandX" [attr.y]="M.t" [attr.width]="b.bandW" [attr.height]="plotH"
                tabindex="0" role="img" [attr.aria-label]="b.tip + ': ' + b.value + ' ' + unit()"
                (pointerenter)="hover.set($index)" (focus)="hover.set($index)" (blur)="hover.set(null)" />
        }
      </svg>
      @if (hovered(); as b) {
        <div class="viz-tooltip" [style.left.px]="b.cx" [style.top.px]="b.top"
             [class.is-start]="b.cx < 80" [class.is-end]="b.cx > width() - 80">
          <span><strong>{{ b.value.toLocaleString('en-US') }}</strong> {{ unit() }}</span>
          <span class="viz-tooltip-sub">{{ b.tip }}</span>
        </div>
      }
    </div>
  `,
})
export class ColumnChart implements OnDestroy {
  readonly data = input.required<ColumnDatum[]>();
  readonly unit = input('sign-ups');

  readonly H = 220;
  readonly M = { t: 16, r: 8, b: 30, l: 40 };
  readonly plotH = this.H - this.M.t - this.M.b;

  readonly width = signal(600);
  readonly hover = signal<number | null>(null);
  private observer?: ResizeObserver;

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    afterNextRender(() => {
      this.observer = new ResizeObserver(([e]) => this.width.set(Math.max(240, Math.floor(e.contentRect.width))));
      this.observer.observe(host);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  /** Clean integer ticks: 0 to a round top in at most ~4 steps. */
  readonly scale = computed(() => {
    const max = Math.max(0, ...this.data().map((d) => d.value));
    const rough = Math.max(1, max) / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rough)));
    const step = Math.max(1, [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag);
    const top = Math.max(step * Math.ceil(Math.max(max, 1) / step), step);
    const ticks: number[] = [];
    for (let t = 0; t <= top; t += step) ticks.push(t);
    return { top, ticks };
  });

  y(v: number): number {
    return this.M.t + this.plotH * (1 - v / this.scale().top);
  }

  readonly bars = computed(() => {
    const d = this.data();
    const plotW = this.width() - this.M.l - this.M.r;
    const band = plotW / Math.max(1, d.length);
    const w = Math.min(24, band * 0.6);
    const base = this.y(0);
    return d.map((p, i) => {
      const cx = this.M.l + band * (i + 0.5);
      const top = this.y(p.value);
      const h = base - top;
      const r = Math.min(4, h, w / 2);
      const x0 = cx - w / 2, x1 = cx + w / 2;
      // Rounded data-end (top), square at the baseline.
      const path = `M${x0},${base} L${x0},${top + r} Q${x0},${top} ${x0 + r},${top} L${x1 - r},${top} Q${x1},${top} ${x1},${top + r} L${x1},${base} Z`;
      return { ...p, cx, top, h, path, bandX: this.M.l + band * i, bandW: band };
    });
  });

  /** Skip x labels so they never collide (about 56px per label). */
  readonly labelEvery = computed(() => {
    const plotW = this.width() - this.M.l - this.M.r;
    return Math.max(1, Math.ceil(this.data().length / Math.max(1, Math.floor(plotW / 56))));
  });

  readonly hovered = computed(() => {
    const i = this.hover();
    return i === null ? null : this.bars()[i] ?? null;
  });

  readonly summary = computed(() => {
    const d = this.data();
    const total = d.reduce((s, p) => s + p.value, 0);
    return `Column chart: ${total} ${this.unit()} across ${d.length} weeks. Use "Show as table" for every value.`;
  });
}
