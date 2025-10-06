import * as Schema from "@effect/schema/Schema";

//#region events.d.ts
type UserSignedIn = {
  userId: string;
};
type UserSignedUp = {
  userId: string;
};
type SessionRevoked = {
  userId: string;
};
type UserUpdated = {
  userId: string;
};
declare const ExampleEvent: Schema.Struct<{
  userId: typeof Schema.String;
  action: typeof Schema.String;
}>;
declare const events: {
  readonly 'user/signed_in': UserSignedIn;
  readonly 'user/signed_up': UserSignedUp;
  readonly 'session/revoked': SessionRevoked;
  readonly 'user/updated': UserUpdated;
  readonly 'pass/update.requested': {
    passTypeIdentifier: string;
    serialNumber: string;
    content: unknown;
  };
};
type KnownEventNames = keyof typeof events;
//#endregion
export { ExampleEvent, KnownEventNames, SessionRevoked, UserSignedIn, UserSignedUp, UserUpdated, events };