// Initial non-Effect event contracts can be refined later
export type UserSignedIn = {
  userId: string;
};

export const events = {
  'user/signed_in': {} as UserSignedIn,
} as const;

export type KnownEventNames = keyof typeof events;
