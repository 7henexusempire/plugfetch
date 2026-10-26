const fs = require('fs');

const buf = fs.readFileSync('/tmp/anitv_unzipped/lib/arm64-v8a/libapp.so');
const text = buf.toString('latin1');

const idx = text.indexOf('/api/v1/tv-receiver/direct-session');
console.log("Index of direct-session:", idx);
if (idx !== -1) {
  console.log("Context around direct-session:", JSON.stringify(text.slice(Math.max(0, idx - 200), idx + 350)));
}
