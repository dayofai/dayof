import { Inngest } from "inngest";

//#region client.browser.ts
function createBrowserInngest(eventKey) {
	return new Inngest({
		id: "dayof",
		eventKey
	});
}

//#endregion
export { createBrowserInngest };