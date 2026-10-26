const fs = require('fs');

async function main() {
  const url = "https://anivortex.in/apk/anitv_3.0.2.apk";
  console.log("Fetching anitv APK...");
  const res = await fetch(url, { headers: { "Range": "bytes=0-8000000" } });
  const buf = Buffer.from(await res.arrayBuffer());
  const str = buf.toString('latin1');
  
  // Look for streambox
  const idx = str.indexOf("streambox");
  console.log("First streambox index:", idx);
  if (idx !== -1) {
    console.log("Surrounding context:", JSON.stringify(str.slice(Math.max(0, idx - 100), idx + 200)));
  }

  // Look for any workers.dev or api endpoints
  const matches = str.match(/https?:\/\/[a-zA-Z0-9.-]+\.(?:com|org|in|net|dev|app|workers\.dev|xyz|site)[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*/g) || [];
  const unique = Array.from(new Set(matches)).filter(u => 
    !u.includes("schemas.android.com") && 
    !u.includes("www.w3.org") && 
    !u.includes("github.com/google") &&
    !u.includes("google.com")
  );
  console.log("Found unique endpoints:", unique);
}

main().catch(console.error);
