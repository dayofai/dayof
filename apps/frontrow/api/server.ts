// @ts-expect-error: built server bundle has no type declarations
import server from '../dist/server/server.js';

export default server;
export const config = { runtime: 'edge' };
