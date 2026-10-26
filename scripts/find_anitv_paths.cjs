const fs = require('fs');

const buf = fs.readFileSync('/tmp/anitv_unzipped/lib/arm64-v8a/libapp.so');
const text = buf.toString('latin1');

const matches = text.match(/[^\x00\r\n]{0,80}\/anitv\/[^\x00\r\n]{0,80}/gi) || [];
console.log("/anitv/ matches:", matches);

const apiMatches = text.match(/[^\x00\r\n]{0,80}api\.anivortex\.in[^\x00\r\n]{0,80}/gi) || [];
console.log("api.anivortex.in matches:", apiMatches);

const liveMatches = text.match(/[^\x00\r\n]{0,80}(?:live|stream|channel|m3u|playlist|events)[^\x00\r\n]{0,80}/gi) || [];
console.log("Sample live/stream matches:", liveMatches.filter(m => m.includes('/api') || m.includes('http')).slice(0, 15));
