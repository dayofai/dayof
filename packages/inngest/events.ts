import * as Schema from '@effect/schema/Schema';

// Initial non-Effect event contracts can be refined later
export type UserSignedIn = {
  userId: string;
};

export type UserSignedUp = {
  userId: string;
};

export type SessionRevoked = {
  userId: string;
};

export type UserUpdated = {
  userId: string;
};

export const ExampleEvent = Schema.Struct({
  userId: Schema.String,
  action: Schema.String,
});

export const events = {
  'user/signed_in': {} as UserSignedIn,
  'user/signed_up': {} as UserSignedUp,
  'session/revoked': {} as SessionRevoked,
  'user/updated': {} as UserUpdated,
  'pass/update.requested': {} as {
    passTypeIdentifier: string;
    serialNumber: string;
    content: unknown;
  },
} as const;

export type KnownEventNames = keyof typeof events;
