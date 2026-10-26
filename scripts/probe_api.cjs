const hash = "8003bfd97ec3d87c8df2280494c3aa26";
const base = "https://api.anivortex.in";

const paths = [
  `/open/${hash}`,
  `/api/open/${hash}`,
  `/streambox/${hash}`,
  `/streambox/open/${hash}`,
  `/stream/${hash}`,
  `/playlist/${hash}`,
  `/channel/${hash}`,
  `/channels/${hash}`,
  `/tv/${hash}`,
  `/live/${hash}`,
  `/m3u/${hash}`,
  `/v1/open/${hash}`,
  `/v1/stream/${hash}`,
  `/v1/streambox/${hash}`,
  `/v1/channel/${hash}`,
  `/v1/channels/${hash}`,
  `/v1/live/${hash}`,
  `/v2/open/${hash}`,
  `/resolve/${hash}`,
  `/box/${hash}`,
  `/${hash}`,
  `/?hash=${hash}`,
  `/?id=${hash}`,
  `/api/v1/open/${hash}`
];

async function check() {
  for (const p of paths) {
    try {
      const res = await fetch(`${base}${p}`, {
        headers: {
          'User-Agent': 'AniTv/3.0.2',
          'Accept': 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(3000)
      });
      console.log(p, "-> Status:", res.status);
      if (res.status !== 404 && res.status !== 502) {
        const text = await res.text();
        console.log("   Body snippet:", text.slice(0, 200));
      }
    } catch (e) {
      console.log(p, "Error:", e.message);
    }
  }
}

check();
