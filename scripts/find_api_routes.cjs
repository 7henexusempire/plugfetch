const fs = require('fs');

const buf = fs.readFileSync('/tmp/anitv_unzipped/lib/arm64-v8a/libapp.so');
const text = buf.toString('latin1');

// Look for any string containing /api/v1/
const apiMatches = text.match(/\/api\/v1\/[a-zA-Z0-9_/-]+/g) || [];
console.log("All /api/v1/ routes in libapp.so:", Array.from(new Set(apiMatches)));
