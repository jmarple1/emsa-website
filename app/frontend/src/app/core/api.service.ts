import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface ImpactStat {
  key: string;
  value: number;
  suffix: string;
  label: string;
  sort: number;
}

export interface ClassSession {
  id: number;
  course: 'BLS' | 'Heartsaver' | 'Stop the Bleed';
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: number;
  seats_left: number;
}

export interface EventItem {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
}

export interface SubmitResult {
  ok: boolean;
  message: string;
}

export interface AdminTable {
  columns: string[];
  rows: Record<string, string | null>[];
}

// All calls go to the same origin; nginx proxies /api to the Drogon backend.
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  impact() { return this.http.get<ImpactStat[]>('/api/impact'); }
  classes() { return this.http.get<ClassSession[]>('/api/classes'); }
  events() { return this.http.get<EventItem[]>('/api/events'); }
  nextMeeting() { return this.http.get<{ next_meeting: string | null }>('/api/settings/next-meeting'); }

  join(body: unknown) { return this.http.post<SubmitResult>('/api/join', body); }
  registerForClass(id: number, body: unknown) { return this.http.post<SubmitResult>(`/api/classes/${id}/register`, body); }
  requestGroupClass(body: unknown) { return this.http.post<SubmitResult>('/api/group-class-requests', body); }
  requestNaloxone(body: unknown) { return this.http.post<SubmitResult>('/api/naloxone-requests', body); }

  login(email: string, password: string) {
    return this.http.post<{ token: string; name: string; email: string }>('/api/auth/login', { email, password });
  }
  adminTable(name: string) { return this.http.get<AdminTable>(`/api/admin/${name}`); }
  adminCsv(name: string) { return this.http.get(`/api/admin/${name}?format=csv`, { responseType: 'blob' }); }
}
