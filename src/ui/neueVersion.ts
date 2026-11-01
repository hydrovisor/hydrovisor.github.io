// Service Worker «Hinweis statt Automatik» (docs/spec/04_architektur.md 7, TO7): eine neue Version wird nur in Heute
// und nur ohne laufenden Ablauf angeboten. Ist offen, ob ein Ablauf läuft (undefined), gibt es keinen Hinweis.
import type { Route } from './router.ts';

export interface HinweisLage {
  route: Route;
  neueVersionWartet: boolean;
  ablaufOffen: boolean | undefined;
}

export function hinweisNeueVersionZeigen({ route, neueVersionWartet, ablaufOffen }: HinweisLage): boolean {
  return route.name === 'heute' && neueVersionWartet && ablaufOffen === false;
}
