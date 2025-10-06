import { Inngest } from "inngest";

//#region client.browser.d.ts
declare function createBrowserInngest(eventKey?: string): Inngest<{
  id: string;
  eventKey: string | undefined;
}>;
//#endregion
export { createBrowserInngest };