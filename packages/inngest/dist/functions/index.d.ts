import * as inngest0 from "inngest";

//#region functions/index.d.ts
declare const functions: inngest0.InngestFunction<Omit<inngest0.InngestFunction.Options<inngest0.Inngest<{
  id: string;
}>, inngest0.InngestMiddleware.Stack, [{
  event: string;
}], inngest0.Handler<inngest0.Inngest<{
  id: string;
}>, string, {
  event: inngest0.FailureEventPayload<inngest0.EventPayload<any>>;
  logger: inngest0.Logger;
  error: Error;
}>>, "triggers">, ({
  event,
  step
}: inngest0.Context<inngest0.Inngest<{
  id: string;
}>, string, {
  logger: inngest0.Logger;
}>) => Promise<{
  ok: boolean;
}>, inngest0.Handler<inngest0.Inngest<{
  id: string;
}>, string, {
  event: inngest0.FailureEventPayload<inngest0.EventPayload<any>>;
  logger: inngest0.Logger;
  error: Error;
}>, inngest0.Inngest<{
  id: string;
}>, inngest0.InngestMiddleware.Stack, [{
  event: string;
}]>[];
//#endregion
export { functions };