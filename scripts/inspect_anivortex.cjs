const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  console.log("Downloading anivortex_5.0.2.apk...");
  execSync('curl -s -L "https://anivortex.in/apk/anivortex_5.0.2.apk" -o /tmp/anivortex.apk', { stdio: 'inherit' });
  console.log("Unzipping anivortex...");
  execSync('unzip -q -o /tmp/anivortex.apk -d /tmp/anivortex_unzipped', { stdio: 'inherit' });
  
  const file = fs.readdirSync('/tmp/anivortex_unzipped/lib').find(f => fs.existsSync(`/tmp/anivortex_unzipped/lib/${f}/libapp.so`));
  if (file) {
    const buf = fs.readFileSync(`/tmp/anivortex_unzipped/lib/${file}/libapp.so`);
    const text = buf.toString('latin1');
    const sb = text.match(/[^\x00\r\n]{0,80}streambox[^\x00\r\n]{0,80}/gi) || [];
    console.log("Streambox occurrences in anivortex libapp.so:", sb.slice(0, 15));
    const urls = text.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s"'\x00]*/g) || [];
    console.log("Sample URLs:", Array.from(new Set(urls)).slice(0, 25));
  }
}

main().catch(console.error);
