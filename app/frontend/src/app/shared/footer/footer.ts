import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Site footer: one shared component. The recognition strip and the three
// disclaimers are required word for word (CLAUDE.md non-negotiables 1, 3, 6).
@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
})
export class Footer {}
