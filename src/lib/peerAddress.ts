import http from "node:http";
import { PEER_HEADER } from "./rateLimit";

// Next doesn't tell route handlers which address a request came from (its x-forwarded-for keeps whatever the visitor
// sent), so this stamps the socket's address on every request as it arrives. It always overwrites the header, so a
// visitor can't fake it.
export function stampPeerAddress() {
  const proto = http.Server.prototype as unknown as {
    emit: (this: http.Server, event: string | symbol, ...args: unknown[]) => boolean;
    deckforgePeerStamped?: boolean;
  };
  if (proto.deckforgePeerStamped) return;
  proto.deckforgePeerStamped = true;

  const emit = proto.emit;
  proto.emit = function (event, ...args) {
    if (event === "request") {
      const req = args[0] as http.IncomingMessage;
      const peer = req.socket?.remoteAddress;
      if (peer) req.headers[PEER_HEADER] = peer;
      else delete req.headers[PEER_HEADER];
    }
    return emit.call(this, event, ...args);
  };
}
