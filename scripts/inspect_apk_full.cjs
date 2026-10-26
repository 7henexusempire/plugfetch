const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  console.log("Downloading APK...");
  execSync('curl -s -L "https://anivortex.in/apk/anitv_3.0.2.apk" -o /tmp/anitv.apk', { stdio: 'inherit' });
  console.log("Unzipping APK...");
  execSync('unzip -q -o /tmp/anitv.apk -d /tmp/anitv_unzipped', { stdio: 'inherit' });
  console.log("Searching for streambox in unzipped files...");
  try {
    const res = execSync('grep -rnw -F "streambox" /tmp/anitv_unzipped || true').toString();
    console.log("Grep output for streambox:", res.slice(0, 500));
  } catch (e) {
    console.error(e);
  }

  try {
    const res2 = execSync('grep -rnw -F "8003bfd97ec3d87c8df2280494c3aa26" /tmp/anitv_unzipped || true').toString();
    console.log("Grep output for hash:", res2.slice(0, 500));
  } catch (e) {}

  // List all strings with http or https in libapp.so or classes.dex
  try {
    const res3 = execSync('strings /tmp/anitv_unzipped/lib/*/libapp.so 2>/dev/null | grep -E "^https?://" | sort -u | grep -v "schemas.android" | head -n 30 || true').toString();
    console.log("libapp.so endpoints:", res3);
  } catch (e) {}
}

main().catch(console.error);
