// Makes the key pair for push notifications (#157). Run once per deployment and store the
// two values as secrets:
//   node scripts/vapid-keys.mjs
//   pnpm wrangler secret put VAPID_PUBLIC_KEY
//   pnpm wrangler secret put VAPID_PRIVATE_KEY
// A new pair makes every device subscribe again, so keep them.
const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
const raw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
const { d } = await crypto.subtle.exportKey('jwk', pair.privateKey);
console.log(`VAPID_PUBLIC_KEY=${Buffer.from(raw).toString('base64url')}`);
console.log(`VAPID_PRIVATE_KEY=${d}`);
