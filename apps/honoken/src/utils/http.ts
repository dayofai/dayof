// Central helpers for Hono contentful status codes used with c.json

export type OkStatus = 200 | 201;
export type ErrorStatus = 400 | 401 | 404 | 409 | 500;

export const toOkStatus = (code: number): OkStatus =>
  code === 201 ? 201 : 200;

export const toErrorStatus = (code: number): ErrorStatus => {
  switch (code) {
    case 400:
    case 401:
    case 404:
    case 409:
    case 500:
      return code;
    default:
      return 400;
  }
};
