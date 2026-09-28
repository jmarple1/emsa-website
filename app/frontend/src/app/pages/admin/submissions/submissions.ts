import { Component, computed, inject, signal } from '@angular/core';
import { AdminTable, ApiService } from '../../../core/api.service';

// Form submissions, read-only except for marking naloxone requests
// fulfilled (which starts the automatic 30-day deletion).
@Component({
  selector: 'app-submissions',
  templateUrl: './submissions.html',
})
export class Submissions {
  private readonly api = inject(ApiService);

  readonly lists = [
    { key: 'join', label: 'Join interest forms' },
    { key: 'registrations', label: 'Class registrations' },
    { key: 'group-requests', label: 'Group class requests' },
    { key: 'naloxone', label: 'Naloxone requests' },
  ];
  readonly current = signal('join');
  readonly table = signal<AdminTable | null>(null);
  readonly query = signal('');
  readonly error = signal('');

  readonly rows = computed(() => {
    const t = this.table();
    if (!t) return [];
    const q = this.query().trim().toLowerCase();
    return q ? t.rows.filter((r) => Object.values(r).some((v) => (v ?? '').toLowerCase().includes(q))) : t.rows;
  });

  constructor() {
    this.show('join');
  }

  show(key: string): void {
    this.current.set(key);
    this.table.set(null);
    this.query.set('');
    this.error.set('');
    this.api.adminTable(key).subscribe({
      next: (t) => this.table.set(t),
      error: () => this.error.set("Couldn't load this list. Please try again."),
    });
  }

  download(): void {
    const key = this.current();
    this.api.adminCsv(key).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `emsa-${key}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set("Couldn't download the CSV. Please try again."),
    });
  }

  toggleFulfilled(row: Record<string, string | null>): void {
    const done = row['fulfilled'] === 'Yes';
    this.api.setFulfilled(Number(row['id']), !done).subscribe({
      next: () => this.show('naloxone'),
      error: () => this.error.set("Couldn't update the request. Please try again."),
    });
  }

  label(column: string): string {
    if (column === 'id') return 'ID';
    return column.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  }
}
