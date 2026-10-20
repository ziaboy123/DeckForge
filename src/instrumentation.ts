// Runs once when the server starts. Rate limits need to know who's really asking, so stamp each request's
// socket address on it (see src/lib/peerAddress.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { stampPeerAddress } = await import("./lib/peerAddress");
  stampPeerAddress();
}
