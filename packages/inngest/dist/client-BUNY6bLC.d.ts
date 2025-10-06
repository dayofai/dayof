import { Inngest } from "inngest";

//#region client.d.ts
declare const inngest: Inngest<{
  id: string;
}>;
//#endregion
export { inngest };