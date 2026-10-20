// Runs once when the server starts. Rate limits need to know who's really asking, so stamp each request's
// socket address on it (see src/lib/peerAddress.ts). Then start loading the card data (see src/lib/cardData.ts),
// so the first visitors don't wait for it.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { stampPeerAddress } = await import("./lib/peerAddress");
  stampPeerAddress();
  // not while building: that shouldn't download anything
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { warmCardData } = await import("./lib/cardData");
  warmCardData();
}
