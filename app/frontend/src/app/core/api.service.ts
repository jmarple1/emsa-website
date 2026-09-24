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
  content() { return this.http.get<Record<string, string>>('/api/content'); }

  join(body: unknown) { return this.http.post<SubmitResult>('/api/join', body); }
  registerForClass(id: number, body: unknown) { return this.http.post<SubmitResult>(`/api/classes/${id}/register`, body); }
  requestGroupClass(body: unknown) { return this.http.post<SubmitResult>('/api/group-class-requests', body); }
  requestNaloxone(body: unknown) { return this.http.post<SubmitResult>('/api/naloxone-requests', body); }

  login(email: string, password: string) {
    return this.http.post<{ token: string; name: string; email: string }>('/api/auth/login', { email, password });
  }
  adminTable(name: string) { return this.http.get<AdminTable>(`/api/admin/${name}`); }
  adminCsv(name: string) { return this.http.get(`/api/admin/${name}?format=csv`, { responseType: 'blob' }); }

  // Officer editing. Times are Oxford local "YYYY-MM-DDTHH:MM" both ways.
  adminContent() { return this.http.get<Record<string, string>>('/api/admin/content'); }
  saveContent(key: string, value: string) { return this.http.put<Ok>(`/api/admin/content/${key}`, { value }); }
  adminClasses() { return this.http.get<AdminClass[] | null>('/api/admin/classes'); }
  createClass(c: ClassInput) { return this.http.post<Ok>('/api/admin/classes', c); }
  updateClass(id: number, c: ClassInput) { return this.http.put<Ok>(`/api/admin/classes/${id}`, c); }
  deleteClass(id: number) { return this.http.delete<Ok>(`/api/admin/classes/${id}`); }
  adminEvents() { return this.http.get<AdminEvent[] | null>('/api/admin/events'); }
  createEvent(e: EventInput) { return this.http.post<Ok>('/api/admin/events', e); }
  updateEvent(id: number, e: EventInput) { return this.http.put<Ok>(`/api/admin/events/${id}`, e); }
  deleteEvent(id: number) { return this.http.delete<Ok>(`/api/admin/events/${id}`); }
  saveImpact(key: string, value: number) { return this.http.put<Ok>(`/api/admin/impact/${key}`, { value }); }
  setFulfilled(id: number, fulfilled: boolean) { return this.http.patch<Ok>(`/api/admin/naloxone/${id}`, { fulfilled }); }
}

export interface Ok { ok: boolean }

export interface ClassInput {
  course: string;
  starts_at: string;
  ends_at: string;
  location: string;
  capacity: number;
  is_open: boolean;
}
export interface AdminClass extends ClassInput { id: number; past: boolean; registered: number }

export interface EventInput {
  title: string;
  starts_at: string;
  ends_at: string;
  location: string;
  description: string;
}
export interface AdminEvent {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  past: boolean;
}
