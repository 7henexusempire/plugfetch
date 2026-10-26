const fs = require('fs');

const file = fs.readdirSync('/tmp/anitv_unzipped/lib').find(f => fs.existsSync(`/tmp/anitv_unzipped/lib/${f}/libapp.so`));
if (file) {
  console.log("Reading libapp.so from", file);
  const buf = fs.readFileSync(`/tmp/anitv_unzipped/lib/${file}/libapp.so`);
  const text = buf.toString('latin1');
  
  const sbMatches = text.match(/[^\x00\r\n]{0,80}streambox[^\x00\r\n]{0,80}/gi) || [];
  console.log("Streambox occurrences in libapp.so:", sbMatches.slice(0, 15));

  const openMatches = text.match(/[^\x00\r\n]{0,80}open\/[a-f0-9]{16,}[^\x00\r\n]{0,80}/gi) || [];
  console.log("Open hash occurrences in libapp.so:", openMatches.slice(0, 15));

  const httpMatches = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s"'\x00]*/g) || [];
  const unique = Array.from(new Set(httpMatches)).filter(u => 
    !u.includes("flutter.dev") && 
    !u.includes("dart-ui") && 
    !u.includes("pub.dev") && 
    !u.includes("mozilla.org")
  );
  console.log("Unique endpoints in libapp.so:", unique.slice(0, 30));
} else {
  console.log("No libapp.so found");
}
