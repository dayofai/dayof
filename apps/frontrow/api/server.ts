import handler from '@tanstack/react-start/server-entry';

export default function vercelEdgeHandler(req: Request) {
  return handler.fetch(req);
}
export const config = { runtime: 'edge' };
