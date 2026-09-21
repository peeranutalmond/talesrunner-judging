import fs from "node:fs";
import path from "node:path";

const jsonPath = path.join(process.cwd(), "public", "drive_files_list.json");
const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const digitalsCount = data.filter(d => d.category.includes("Digital")).length;
const traditionalsCount = data.filter(d => d.category.includes("Traditional")).length;

const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>รายการไฟล์ Google Drive สำหรับดาวน์โหลด - Tales Artventure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;900&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Prompt', sans-serif; background-color: #f0f9ff; }
    h1, h2, h3, .heading-font { font-family: 'Kanit', sans-serif; }
    .comic-card { border: 2px solid #0f172a; box-shadow: 4px 4px 0 #0f172a; border-radius: 1rem; }
    .arcade-btn { border: 2px solid #0f172a; box-shadow: 2px 2px 0 #0f172a; transition: all 0.15s ease; }
    .arcade-btn:hover { transform: translate(-1px, -1px); box-shadow: 3px 3px 0 #0f172a; }
    .arcade-btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 #0f172a; }
  </style>
</head>
<body class="min-h-screen text-slate-800 p-4 sm:p-6 lg:p-10">
  <div class="max-w-6xl mx-auto space-y-6">

    <!-- Top Navigation / Brand -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-white p-4 comic-card">
      <div class="flex items-center gap-3">
        <span class="text-3xl">📁</span>
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900 leading-tight">คลังไฟล์ Google Drive ทุกลำดับ</h1>
          <p class="text-xs text-slate-500">Tales Artventure : Animal Village with Friends (รวม ${data.length} ชิ้นงาน)</p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="/drive_files_list.csv" download="drive_files_list.csv" class="arcade-btn inline-flex items-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold">
          📥 ดาวน์โหลด CSV (Excel)
        </a>
        <button onclick="copyAllLinks()" id="btnCopyAll" class="arcade-btn inline-flex items-center gap-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold">
          📋 คัดลอกทุกลิงก์ (${data.length} Links)
        </button>
        <a href="/judge" class="arcade-btn inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold">
          🎮 ไปห้องตัดสิน
        </a>
      </div>
    </div>

    <!-- Quick How-To Card -->
    <div class="bg-white p-5 comic-card border-l-8 border-l-sky-500 space-y-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">💡</span>
        <h2 class="text-lg font-bold text-slate-900">วิธีดาวน์โหลดรูปภาพมาใส่ในระบบ (3 ขั้นตอนง่ายๆ)</h2>
      </div>
      <div class="grid gap-3 sm:grid-cols-3 text-xs sm:text-sm text-slate-600">
        <div class="p-3 bg-sky-50 rounded-xl border border-sky-200">
          <strong class="text-sky-900 block text-sm font-bold mb-1">1. โหลดภาพจาก Drive</strong>
          กดปุ่ม <strong>"เปิด Google Drive ↗"</strong> ที่แถวผลงานที่ต้องการ แล้วดาวน์โหลดรูปภาพลงเครื่องคอมพิวเตอร์ของคุณ
        </div>
        <div class="p-3 bg-sky-50 rounded-xl border border-sky-200">
          <strong class="text-sky-900 block text-sm font-bold mb-1">2. บันทึกชื่อตามรหัส</strong>
          บันทึกหรือเปลี่ยนชื่อไฟล์ให้ตรงกับเลขผลงาน เช่น <code class="font-bold text-sky-700 bg-white px-1 rounded">001.png</code> แล้วนำไปวางในโฟลเดอร์:
          <code class="block font-mono text-[11px] bg-white p-1 rounded mt-1 border text-slate-700">public/artworks/</code>
        </div>
        <div class="p-3 bg-sky-50 rounded-xl border border-sky-200">
          <strong class="text-sky-900 block text-sm font-bold mb-1">3. กดซิงค์รูปเข้าเว็บ</strong>
          ไปที่หน้า <strong>Admin ➔ Submissions</strong> แล้วกดปุ่ม <strong>"🔄 ซิงค์ภาพจากเครื่อง"</strong> หรือรันสคริปต์
          <code class="block font-mono text-[11px] bg-white p-1 rounded mt-1 border text-slate-700">node scripts/sync-local-artworks.mjs</code>
        </div>
      </div>
    </div>

    <!-- Search and Filter Bar -->
    <div class="bg-white p-4 comic-card space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex-1 min-w-[240px]">
          <input type="text" id="searchInput" oninput="applyFilters()" placeholder="🔍 ค้นหาหมายเลข, ชื่อภาพ, นามปากกา, ไอดีเกม..." 
                 class="w-full px-4 py-2 text-sm border-2 border-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 font-medium">
        </div>
        <div class="flex flex-wrap gap-1.5 text-xs font-bold" id="filterTabs">
          <button onclick="setFilter('all')" id="tab-all" class="filter-tab px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-sky-400 text-slate-950 arcade-btn">
            🏁 ทั้งหมด (${data.length} ชิ้น)
          </button>
          <button onclick="setFilter('digital')" id="tab-digital" class="filter-tab px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-slate-100 text-slate-700 arcade-btn">
            🖥️ Digital Art (${digitalsCount})
          </button>
          <button onclick="setFilter('traditional')" id="tab-traditional" class="filter-tab px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-slate-100 text-slate-700 arcade-btn">
            ✏️ Traditional Art (${traditionalsCount})
          </button>
        </div>
      </div>
      <div class="flex items-center justify-between text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
        <span id="resultCount">แสดงทั้งหมด ${data.length} รายการ</span>
        <span>คลิกที่ปุ่มคัดลอก เพื่อก๊อปปี้ชื่อไฟล์หรือลิงก์ได้ทันที</span>
      </div>
    </div>

    <!-- Table of Submissions -->
    <div class="bg-white comic-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm" id="filesTable">
          <thead class="bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
            <tr>
              <th class="p-3 text-center w-16">#</th>
              <th class="p-3">ชื่อผลงาน & สายการประกวด</th>
              <th class="p-3">ศิลปิน / นามปากกา</th>
              <th class="p-3">ไอดีเกม / UID</th>
              <th class="p-3 text-center">ชื่อไฟล์ที่แนะนำ</th>
              <th class="p-3 text-right">ลิงก์ Google Drive</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200" id="tableBody">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
    </div>

  </div>

  <script>
    const ITEMS = ${JSON.stringify(data)};
    let activeFilter = 'real'; // default to real entries #8-#69

    function setFilter(filter) {
      activeFilter = filter;
      document.querySelectorAll('.filter-tab').forEach(el => {
        el.className = 'filter-tab px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-slate-100 text-slate-700 arcade-btn';
      });
      const activeBtn = document.getElementById('tab-' + filter);
      if (activeBtn) {
        activeBtn.className = 'filter-tab px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-sky-400 text-slate-950 arcade-btn font-black';
      }
      applyFilters();
    }

    function applyFilters() {
      const q = (document.getElementById('searchInput').value || '').trim().toLowerCase();
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';

      const filtered = ITEMS.filter(item => {
        // filter tab
        if (activeFilter === 'real' && item.index < 8) return false;
        if (activeFilter === 'digital' && !item.category.includes('Digital')) return false;
        if (activeFilter === 'traditional' && !item.category.includes('Traditional')) return false;

        // search query
        if (q) {
          const matchStr = (item.submissionNumber + ' ' + item.title + ' ' + item.penName + ' ' + item.trUser + ' ' + item.uid + ' ' + item.category).toLowerCase();
          if (!matchStr.includes(q)) return false;
        }
        return true;
      });

      document.getElementById('resultCount').innerText = 'แสดง ' + filtered.length + ' จากทั้งหมด ' + ITEMS.length + ' รายการ';

      filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-sky-50/70 transition-colors align-middle';

        const isTest = item.index < 8;
        const testBadge = isTest ? '<span class="ml-1.5 px-1.5 py-0.5 text-[10px] font-black rounded bg-amber-200 text-amber-900 border border-amber-400">เทสต์</span>' : '';
        const isDigital = item.category.includes('Digital');
        const catBadge = isDigital 
          ? '<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">🖥️ Digital Art</span>'
          : '<span class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">✏️ Traditional Art</span>';

        const defaultFileName = item.submissionNumber + '.jpg';

        tr.innerHTML = \`
          <td class="p-3 text-center font-black text-sky-700">
            <span class="inline-block px-2 py-1 rounded-lg bg-sky-100 border border-sky-300 font-mono">#\${item.submissionNumber}</span>
          </td>
          <td class="p-3">
            <div class="font-bold text-slate-900 flex items-center flex-wrap gap-1">
              \${item.title} \${testBadge}
            </div>
            <div class="mt-1">\${catBadge}</div>
          </td>
          <td class="p-3 font-medium text-slate-800">
            <div>\${item.penName || '—'}</div>
          </td>
          <td class="p-3 text-xs text-slate-500">
            <div>ไอดี: <strong class="text-slate-700">\${item.trUser || '—'}</strong></div>
            <div>UID: <strong class="text-slate-700">\${item.uid || '—'}</strong></div>
          </td>
          <td class="p-3 text-center">
            <button onclick="copyText('\${defaultFileName}', this)" title="คลิกเพื่อคัดลอกชื่อไฟล์นี้" class="inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-1 rounded-md bg-slate-100 hover:bg-sky-200 border border-slate-300 transition">
              <span>\${defaultFileName}</span>
              <span class="text-slate-400 text-[10px]">📋</span>
            </button>
          </td>
          <td class="p-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <a href="\${item.driveLink}" target="_blank" rel="noreferrer" class="arcade-btn inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg bg-white hover:bg-sky-100 text-sky-700">
                <span>เปิด Drive ↗</span>
              </a>
              <button onclick="copyText('\${item.driveLink}', this)" class="arcade-btn inline-flex items-center text-xs font-bold px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" title="คัดลอกลิงก์">
                📋
              </button>
            </div>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function copyText(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ คัดลอกแล้ว!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 1500);
      });
    }

    function copyAllLinks() {
      const links = ITEMS.map(item => item.driveLink).join('\\n');
      navigator.clipboard.writeText(links).then(() => {
        const btn = document.getElementById('btnCopyAll');
        const old = btn.innerHTML;
        btn.innerHTML = '✓ คัดลอก 69 ลิงก์แล้ว!';
        setTimeout(() => {
          btn.innerHTML = old;
        }, 2000);
      });
    }

    // Init
    setFilter('real');
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(process.cwd(), "public", "drive-links.html"), html, "utf8");
console.log("Successfully generated public/drive-links.html");
