import { setupServer } from "msw/node";

/** HTTP-boundary test server. Tests add handlers with `server.use(...)`. */
export const server = setupServer();
