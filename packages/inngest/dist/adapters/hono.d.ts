import { Hono } from "hono";

//#region adapters/hono.d.ts
declare function mountInngest(app: Hono, path?: string): void;
//#endregion
export { mountInngest };