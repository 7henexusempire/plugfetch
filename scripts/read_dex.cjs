const fs = require('fs');

const buf = fs.readFileSync('/tmp/anitv_unzipped/classes.dex');
const text = buf.toString('latin1');

const matches = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s"'\x00]*/g) || [];
const unique = Array.from(new Set(matches)).filter(u => 
  !u.includes("schemas.android.com") && 
  !u.includes("www.w3.org") && 
  !u.includes("google") && 
  !u.includes("android") &&
  !u.includes("apache")
);
console.log("Unique URLs in classes.dex:", unique);

const schemes = text.match(/[a-zA-Z0-9_-]+:\/\/open[^\s"'\x00]*/gi) || [];
console.log("Open schemes:", Array.from(new Set(schemes)));

const sbMatches = text.match(/[^\x00]{0,50}streambox[^\x00]{0,50}/gi) || [];
console.log("Streambox occurrences:", sbMatches.slice(0, 10));
