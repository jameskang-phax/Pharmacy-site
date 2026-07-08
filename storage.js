/* ============================================================
   儲位查詢：改為即時讀取 Google 試算表
   ------------------------------------------------------------
   資料來源：Google 試算表 → 發布到網路的 CSV → 網站抓取顯示
   設定方式請見 README「維護藥品儲位查詢」章節

   欄位順序（試算表欄位順序要跟這個一樣）：
   藥品代碼、學名、商品名、中文名、住／急儲位、門診儲位
   ============================================================ */

var STORAGE_CSV_URL = "REPLACE_WITH_YOUR_STORAGE_SHEET_CSV_URL";

function parseCSV(text){
  var rows = [];
  var row = [];
  var field = '';
  var inQuotes = false;
  for(var i = 0; i < text.length; i++){
    var c = text[i];
    if(inQuotes){
      if(c === '"'){
        if(text[i+1] === '"'){ field += '"'; i++; }
        else{ inQuotes = false; }
      }else{
        field += c;
      }
    }else{
      if(c === '"'){ inQuotes = true; }
      else if(c === ','){ row.push(field); field = ''; }
      else if(c === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
      else if(c === '\r'){ /* skip */ }
      else{ field += c; }
    }
  }
  if(field.length > 0 || row.length > 0){ row.push(field); rows.push(row); }
  return rows.filter(function(r){ return r.some(function(cell){ return cell.trim() !== ''; }); });
}

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, function(s){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s];
  });
}

function locBadge(val){
  var v = (val || "").trim();
  if(!v) return '<dd class="loc empty">未登記</dd>';
  return '<dd class="loc">' + escapeHtml(v) + '</dd>';
}

var STORAGE_ITEMS = [];

function renderList(items){
  var list = document.getElementById("list");
  var count = document.getElementById("count");

  count.textContent = "找到 " + items.length + " 筆藥品資料";

  if(items.length === 0){
    list.innerHTML = '<div class="empty-state">查無符合的藥品，換個關鍵字試試看。</div>';
    return;
  }

  list.innerHTML = items.map(function(d){
    return '<div class="drug-card">' +
      '<div class="row1">' +
        '<div class="names">' +
          '<span class="generic">' + escapeHtml(d.cname || d.generic) + '</span>' +
          '<span class="brand">' + escapeHtml(d.brand) + '</span>' +
        '</div>' +
        '<span class="code">' + escapeHtml(d.code) + '</span>' +
      '</div>' +
      '<dl>' +
        '<dt>學名</dt><dd>' + escapeHtml(d.generic) + '</dd>' +
        '<dt>住／急儲位</dt>' + locBadge(d.ward) +
        '<dt>門診儲位</dt>' + locBadge(d.opd) +
      '</dl>' +
    '</div>';
  }).join("");
}

function search(keyword){
  var k = keyword.trim().toLowerCase();
  if(!k) return STORAGE_ITEMS;
  return STORAGE_ITEMS.filter(function(d){
    return Object.values(d).some(function(v){ return String(v).toLowerCase().includes(k); });
  });
}

function loadStorageData(){
  var list = document.getElementById("list");
  var count = document.getElementById("count");
  var errorEl = document.getElementById("error");

  if(!STORAGE_CSV_URL || STORAGE_CSV_URL.indexOf('REPLACE_WITH') === 0){
    count.textContent = "";
    list.innerHTML = "";
    errorEl.textContent = "尚未設定儲位資料來源，請依 README 說明完成 Google 試算表設定。";
    errorEl.style.display = "block";
    return;
  }

  count.textContent = "資料載入中…";
  errorEl.style.display = "none";

  fetch(STORAGE_CSV_URL + (STORAGE_CSV_URL.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now())
    .then(function(res){
      if(!res.ok) throw new Error('network');
      return res.text();
    })
    .then(function(text){
      var rows = parseCSV(text);
      var dataRows = rows.slice(1); // 第一列是表頭
      STORAGE_ITEMS = dataRows.map(function(r){
        return {
          code: (r[0] || '').trim(),
          generic: (r[1] || '').trim(),
          brand: (r[2] || '').trim(),
          cname: (r[3] || '').trim(),
          ward: (r[4] || '').trim(),
          opd: (r[5] || '').trim()
        };
      }).filter(function(item){ return item.code !== ''; });

      var input = document.getElementById("q");
      renderList(search(input.value));
    })
    .catch(function(){
      count.textContent = "";
      list.innerHTML = "";
      errorEl.textContent = "資料載入失敗，請確認網路連線，或稍後再試一次。";
      errorEl.style.display = "block";
    });
}

document.addEventListener("DOMContentLoaded", function(){
  loadStorageData();
  var input = document.getElementById("q");
  input.addEventListener("input", function(){
    renderList(search(input.value));
  });
  var refreshBtn = document.getElementById("refresh");
  if(refreshBtn){
    refreshBtn.addEventListener("click", loadStorageData);
  }
});
