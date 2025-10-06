import { functions } from "../functions-Ckuh7UmU.js";
import { inngest } from "../client-DXOXRk7j.js";
import { serve } from "inngest/hono";

//#region adapters/hono.ts
function mountInngest(app, path = "/api/inngest") {
	app.on([
		"GET",
		"POST",
		"PUT"
	], path, serve({
		client: inngest,
		functions
	}));
}

//#endregion
export { mountInngest };