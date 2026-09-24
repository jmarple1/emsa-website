import { Component, computed, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdminTable, ApiService, ClassSession } from '../../../core/api.service';
import { formatWhen } from '../../../core/format';
import { BarDatum, BarList } from '../charts/bar-list';
import { ColumnChart, ColumnDatum } from '../charts/column-chart';

type Row = Record<string, string | null>;
type Range = 30 | 90 | 0;

const DAY = 86_400_000;
const YEARS = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Graduate student', 'Other'];
// The admin naloxone list names items as below (AdminController.cpp);
// the value is the chart label.
const ITEMS: Record<string, string> = {
  'Naloxone': 'Naloxone (Narcan)',
  'Fentanyl test strips': 'Fentanyl test strips',
  'Condoms': 'Condoms',
  'Educational materials': 'Educational materials',
};

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home', '/what-we-do': 'What We Do', '/join': 'Join', '/cpr-classes': 'CPR Classes',
  '/naloxone': 'Naloxone', '/emergency': 'In an Emergency', '/events': 'Events', '/about': 'About',
  '/faq': 'FAQ', '/contact': 'Contact', '/privacy': 'Privacy',
};

/** Admin times arrive as Oxford local "YYYY-MM-DD HH:MM". */
const when = (s: string | null | undefined) => (s ? new Date(s.replace(' ', 'T')) : null);
const weekStart = (d: Date) => {
  const w = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  w.setDate(w.getDate() - w.getDay()); // Sunday
  return w;
};
const short = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

interface Kpi {
  label: string;
  value: number;
  delta: number | null;   // vs the previous period of the same length
  upIsGood: boolean | null; // null = neither direction is good or bad news
  note?: string;
}

@Component({
  selector: 'app-admin-overview',
  imports: [ColumnChart, BarList],
  templateUrl: './overview.html',
})
export class Overview {
  private readonly api = inject(ApiService);

  readonly ranges: { value: Range; label: string }[] = [
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' },
    { value: 0, label: 'All time' },
  ];
  readonly range = signal<Range>(30);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tables = signal<Record<'join' | 'regs' | 'groups' | 'naloxone' | 'views', Row[]>>({ join: [], regs: [], groups: [], naloxone: [], views: [] });
  readonly classes = signal<ClassSession[]>([]);
  readonly showTable = signal<Record<string, boolean>>({});
  readonly when = formatWhen;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      join: this.api.adminTable('join'),
      regs: this.api.adminTable('registrations'),
      groups: this.api.adminTable('group-requests'),
      naloxone: this.api.adminTable('naloxone'),
      views: this.api.adminTable('page-views'),
      classes: this.api.classes(),
    }).subscribe({
      next: (r) => {
        const rows = (t: AdminTable) => t.rows;
        this.tables.set({ join: rows(r.join), regs: rows(r.regs), groups: rows(r.groups), naloxone: rows(r.naloxone), views: rows(r.views) });
        this.classes.set(r.classes);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Couldn't load the dashboard. Please try again.");
      },
    });
  }

  toggleTable(key: string): void {
    this.showTable.update((s) => ({ ...s, [key]: !s[key] }));
  }

  private inRange(d: Date | null, offset = 0): boolean {
    if (!d) return false;
    const days = this.range();
    if (!days) return offset === 0;
    const end = Date.now() - offset * days * DAY;
    return d.getTime() <= end && d.getTime() > end - days * DAY;
  }

  private count(rows: Row[], col: string, offset = 0): number {
    return rows.filter((r) => this.inRange(when(r[col]), offset)).length;
  }

  readonly rangeLabel = computed(() => this.ranges.find((r) => r.value === this.range())!.label.toLowerCase());
  /** "in the last 30 days", or "of all time". */
  readonly inRangeLabel = computed(() => (this.range() ? 'in the ' + this.rangeLabel() : 'of all time'));

  readonly kpis = computed<Kpi[]>(() => {
    const t = this.tables();
    const hasPrev = this.range() !== 0;
    const kpi = (label: string, rows: Row[], col: string, upIsGood: boolean | null, note?: string): Kpi => {
      const value = this.count(rows, col);
      return { label, value, delta: hasPrev ? value - this.count(rows, col, 1) : null, upIsGood, note };
    };
    const open = t.naloxone.filter((r) => r['fulfilled'] === 'No').length;
    return [
      kpi('Join sign-ups', t.join, 'submitted', true),
      kpi('Class registrations', t.regs, 'registered', true),
      kpi('Group class requests', t.groups, 'submitted', true),
      kpi('Naloxone requests', t.naloxone, 'submitted', null, `${open} not yet fulfilled`),
    ];
  });

  /** Sums dated counts into weekly columns covering the selected range. */
  private byWeek(points: { d: Date | null; n: number }[]): ColumnDatum[] {
    const now = new Date();
    let first: Date;
    if (this.range()) {
      first = weekStart(new Date(now.getTime() - (this.range() - 1) * DAY));
    } else {
      const dates = points.map((p) => p.d).filter((d): d is Date => !!d);
      const earliest = dates.length ? new Date(Math.min(...dates.map((d) => d.getTime()))) : now;
      first = weekStart(earliest);
      const minFirst = weekStart(new Date(now.getTime() - 7 * 7 * DAY)); // show at least 8 weeks
      if (first > minFirst) first = minFirst;
    }
    const weeks: ColumnDatum[] = [];
    const index = new Map<number, number>();
    for (let w = new Date(first); w <= now; w.setDate(w.getDate() + 7)) {
      index.set(w.getTime(), weeks.length);
      weeks.push({ label: short.format(w), tip: `Week of ${short.format(w)}`, value: 0 });
    }
    for (const p of points) {
      if (!p.d || !this.inRange(p.d)) continue;
      const i = index.get(weekStart(p.d).getTime());
      if (i !== undefined) weeks[i].value += p.n;
    }
    return weeks;
  }

  readonly weekly = computed<ColumnDatum[]>(() =>
    this.byWeek(this.tables().join.map((r) => ({ d: when(r['submitted']), n: 1 }))),
  );

  /** Page views: one row per page per day ("YYYY-MM-DD", read as local midnight, not UTC). */
  private readonly viewPoints = computed(() =>
    this.tables().views.map((r) => ({ d: r['day'] ? new Date(`${r['day']}T00:00`) : null, n: Number(r['views'] ?? 0), page: r['page'] ?? '' })),
  );
  readonly viewsWeekly = computed<ColumnDatum[]>(() => this.byWeek(this.viewPoints()));
  readonly viewsTotal = computed(() => this.viewsWeekly().reduce((s, w) => s + w.value, 0));
  readonly topPages = computed<BarDatum[]>(() => {
    const counts = new Map<string, number>();
    for (const p of this.viewPoints()) if (this.inRange(p.d)) counts.set(p.page, (counts.get(p.page) ?? 0) + p.n);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([page, value]) => ({ label: PAGE_NAMES[page] ?? page, value }));
  });

  readonly byYear = computed<BarDatum[]>(() => {
    const rows = this.tables().join.filter((r) => this.inRange(when(r['submitted'])));
    return YEARS.map((y) => ({ label: y, value: rows.filter((r) => r['year'] === y).length }));
  });

  readonly emt = computed(() => {
    const rows = this.tables().join.filter((r) => this.inRange(when(r['submitted'])));
    const yes = rows.filter((r) => r['emt_certified'] === 'Yes').length;
    return { yes, total: rows.length, pct: rows.length ? Math.round((yes / rows.length) * 100) : 0 };
  });

  readonly items = computed<BarDatum[]>(() => {
    const rows = this.tables().naloxone.filter((r) => this.inRange(when(r['submitted'])));
    const counts: Record<string, number> = {};
    for (const r of rows) for (const it of (r['items'] ?? '').split(', ')) if (it) counts[it] = (counts[it] ?? 0) + 1;
    return Object.entries(ITEMS).map(([key, label]) => ({ label, value: counts[key] ?? 0 }));
  });

  readonly weeklyTotal = computed(() => this.weekly().reduce((s, w) => s + w.value, 0));
  readonly itemsTotal = computed(() => this.items().reduce((s, w) => s + w.value, 0));

  fill(c: ClassSession): number {
    return Math.round(((c.capacity - c.seats_left) / c.capacity) * 100);
  }

  abs(n: number): number {
    return Math.abs(n);
  }
}
