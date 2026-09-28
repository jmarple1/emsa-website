import { Component, computed, inject } from '@angular/core';
import { ImpactService } from '../../core/impact.service';
import { ContentService } from '../../core/content.service';

// Shown until officers fill in Site content > "Leadership".
const DEFAULT_LEADERS = [
  { name: 'Max Ilecki', role: 'Co-President' },
  { name: 'Jordan Vandeventer', role: 'Co-President' },
  { name: 'Leslie Haxby-McNeill', role: 'Faculty Advisor' },
];

@Component({
  selector: 'app-about',
  imports: [],
  templateUrl: './about.html',
})
export class About {
  protected readonly impact = inject(ImpactService);
  protected readonly content = inject(ContentService);

  /** Officer-edited list if set, otherwise the founding leadership. */
  readonly leaders = computed(() => {
    const edited = this.content.people('leadership');
    return edited.length ? edited : DEFAULT_LEADERS;
  });
  readonly edited = computed(() => this.content.people('leadership').length > 0);

  constructor() {
    this.impact.load();
    this.content.load();
  }

  /** "Leslie Haxby-McNeill" -> "LH" (stands in for a headshot). */
  initials(name: string): string {
    const parts = name.split(/\s+/).filter(Boolean);
    return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  }
}
