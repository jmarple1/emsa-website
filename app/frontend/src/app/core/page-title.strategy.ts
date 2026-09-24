import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

// Sets <title> and <meta name="description"> from each route's data.
@Injectable({ providedIn: 'root' })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title) this.title.setTitle(title);

    let route = snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const description = route.data['description'] as string | undefined;
    if (description) this.meta.updateTag({ name: 'description', content: description });
  }
}
