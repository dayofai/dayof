import { Inngest } from 'inngest';

export function createBrowserInngest(eventKey?: string) {
  return new Inngest({ id: 'dayof', eventKey });
}
