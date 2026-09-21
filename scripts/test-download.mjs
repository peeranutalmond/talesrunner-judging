async function testDownload() {
  const fileIds = [
    "1ieVqMOaY9Ym04Xj3A78pVKB5z5W_Ft1j", // item 8
    "1zjrSrQoj3-mUNCRZXzF_TAm_HTj-t4NV" // item 1
  ];

  for (const fileId of fileIds) {
    console.log(`--- Testing fileId: ${fileId} ---`);
    const urls = [
      `https://drive.google.com/uc?export=download&id=${fileId}`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
      `https://lh3.googleusercontent.com/d/${fileId}`
    ];

    for (const u of urls) {
      try {
        const res = await fetch(u, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });
        const contentType = res.headers.get("content-type");
        const status = res.status;
        console.log(`URL: ${u}`);
        console.log(`Status: ${status}, Content-Type: ${contentType}`);
        if (contentType && contentType.startsWith("image/")) {
          const buf = await res.arrayBuffer();
          console.log(`=> SUCCESS! Received image (${buf.byteLength} bytes)`);
        } else {
          const text = await res.text();
          console.log(`=> Received non-image (${text.length} chars). Title snippet: ${text.slice(0, 150).replace(/\s+/g, ' ')}`);
        }
      } catch (err) {
        console.error(`Error fetching ${u}:`, err.message);
      }
    }
  }
}

testDownload();
