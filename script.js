/* ============================================================
   藥品電子檔資料
   ------------------------------------------------------------
   如何更新藥品資料：
   1. 到 GitHub 上找到這個檔案 (script.js)，點右上角鉛筆圖示編輯
   2. 依照下方格式，複製一筆貼上、修改內容即可新增藥品
   3. 修改完點 "Commit changes" 存檔，網頁會自動更新（約1分鐘內生效）
   ============================================================ */

const DRUGS = [
  {
    code: "AMX-001",
    generic: "Amoxicillin",
    brand: "安莫西林膠囊",
    form: "膠囊 250mg / 500mg",
    route: "口服",
    use: "細菌感染（呼吸道、泌尿道、皮膚等）",
    sideEffect: "腹瀉、噁心、皮疹",
    warning: "青黴素過敏者禁用",
    storage: "室溫，避光"
  },
  {
    code: "MET-014",
    generic: "Metformin",
    brand: "庫魯化錠",
    form: "錠劑 500mg",
    route: "口服",
    use: "第二型糖尿病，控制血糖",
    sideEffect: "腸胃不適、腹瀉、金屬味",
    warning: "腎功能不全者慎用，顯影劑檢查前後需暫停使用",
    storage: "室溫，防潮"
  },
  {
    code: "WAR-007",
    generic: "Warfarin",
    brand: "可化凝錠",
    form: "錠劑 1mg / 5mg",
    route: "口服",
    use: "抗凝血，預防血栓栓塞",
    sideEffect: "出血傾向、瘀青",
    warning: "與多種藥物、食物（如深綠色蔬菜）交互作用，需定期監測 INR",
    storage: "室溫，避光"
  },
  {
    code: "OME-022",
    generic: "Omeprazole",
    brand: "奧美拉唑膠囊",
    form: "腸溶膠囊 20mg",
    route: "口服",
    use: "胃食道逆流、消化性潰瘍",
    sideEffect: "頭痛、腹瀉、腹脹",
    warning: "長期使用可能影響 B12 吸收",
    storage: "室溫，避光防潮"
  }
];

/* ============================================================
   以下為搜尋與畫面渲染邏輯，一般不需要修改
   ============================================================ */

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[s]));
}

function renderList(items){
  const list = document.getElementById("list");
  const count = document.getElementById("count");

  count.textContent = `找到 ${items.length} 筆藥品資料`;

  if(items.length === 0){
    list.innerHTML = `<div class="empty-state">查無符合的藥品，換個關鍵字試試看。</div>`;
    return;
  }

  list.innerHTML = items.map(d => `
    <div class="drug-card">
      <div class="row1">
        <div class="names">
          <span class="generic">${escapeHtml(d.generic)}</span>
          <span class="brand">${escapeHtml(d.brand)}</span>
        </div>
        <span class="code">${escapeHtml(d.code)}</span>
      </div>
      <dl>
        <dt>劑型劑量</dt><dd>${escapeHtml(d.form)}</dd>
        <dt>給藥途徑</dt><dd>${escapeHtml(d.route)}</dd>
        <dt>用途</dt><dd>${escapeHtml(d.use)}</dd>
        <dt>常見副作用</dt><dd>${escapeHtml(d.sideEffect)}</dd>
        <dt>注意事項</dt><dd class="warn">${escapeHtml(d.warning)}</dd>
        <dt>儲存方式</dt><dd>${escapeHtml(d.storage)}</dd>
      </dl>
    </div>
  `).join("");
}

function search(keyword){
  const k = keyword.trim().toLowerCase();
  if(!k) return DRUGS;
  return DRUGS.filter(d =>
    Object.values(d).some(v => String(v).toLowerCase().includes(k))
  );
}

document.addEventListener("DOMContentLoaded", () => {
  renderList(DRUGS);
  const input = document.getElementById("q");
  input.addEventListener("input", () => {
    renderList(search(input.value));
  });
});
