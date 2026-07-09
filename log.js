/* ============================================================
   表單填寫紀錄預覽（通用版）
   ------------------------------------------------------------
   資料來源：Google 表單回覆試算表 → 發布到網路的 CSV → 網站讀取顯示
   使用方式：每個頁面在載入這個檔案「之前」，先設定：
     window.LOG_CSV_URL = "你的試算表CSV網址";
   欄位名稱會直接讀試算表的表頭列，不需要另外設定欄位對應。
   ============================================================ */

function parseLogCSV(text){
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

function escapeLogHtml(str){
  return String(str).replace(/[&<>"']/g, function(s){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s];
  });
}

var LOG_HEADERS = [];
var LOG_ITEMS = [];

function renderLogList(items){
  var list = document.getElementById("list");
  var count = document.getElementById("count");
  var empty = document.getElementById("empty");

  count.textContent = "找到 " + items.length + " 筆紀錄";

  if(items.length === 0){
    list.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  list.innerHTML = items.map(function(item){
    var fieldsHtml = item.fields
      .filter(function(f){ return f.value && f.value.trim() !== ''; })
      .map(function(f){
        return '<dt>' + escapeLogHtml(f.label) + '</dt><dd>' + escapeLogHtml(f.value) + '</dd>';
      }).join('');
    return '<div class="log-item">' +
      '<div class="log-date">' + escapeLogHtml(item.ts) + '</div>' +
      '<dl class="log-fields">' + fieldsHtml + '</dl>' +
    '</div>';
  }).join("");
}

function searchLog(keyword){
  var k = keyword.trim().toLowerCase();
  if(!k) return LOG_ITEMS;
  return LOG_ITEMS.filter(function(item){
    return item.ts.toLowerCase().includes(k) ||
      item.fields.some(function(f){ return String(f.value).toLowerCase().includes(k); });
  });
}

function loadLogData(){
  var list = document.getElementById("list");
  var count = document.getElementById("count");
  var errorEl = document.getElementById("error");
  var empty = document.getElementById("empty");

  if(!window.LOG_CSV_URL || window.LOG_CSV_URL.indexOf('REPLACE_WITH') === 0){
    count.textContent = "";
    list.innerHTML = "";
    empty.style.display = "none";
    errorEl.textContent = "尚未設定資料來源，請依 README 說明完成 Google 試算表設定。";
    errorEl.style.display = "block";
    return;
  }

  count.textContent = "資料載入中…";
  errorEl.style.display = "none";
  empty.style.display = "none";

  fetch(window.LOG_CSV_URL + (window.LOG_CSV_URL.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now())
    .then(function(res){
      if(!res.ok) throw new Error('network');
      return res.text();
    })
    .then(function(text){
      var rows = parseLogCSV(text);
      LOG_HEADERS = rows[0] || [];
      var dataRows = rows.slice(1);

      LOG_ITEMS = dataRows.map(function(r){
        return {
          ts: (r[0] || '').trim(),
          fields: LOG_HEADERS.slice(1).map(function(h, i){
            return { label: h, value: (r[i + 1] || '').trim() };
          })
        };
      }).filter(function(item){ return item.ts !== ''; });

      LOG_ITEMS.sort(function(a, b){ return new Date(b.ts) - new Date(a.ts); });

      var input = document.getElementById("q");
      renderLogList(searchLog(input.value));
    })
    .catch(function(){
      count.textContent = "";
      list.innerHTML = "";
      empty.style.display = "none";
      errorEl.textContent = "資料載入失敗，請確認網路連線，或稍後再試一次。";
      errorEl.style.display = "block";
    });
}

document.addEventListener("DOMContentLoaded", function(){
  loadLogData();
  var input = document.getElementById("q");
  input.addEventListener("input", function(){
    renderLogList(searchLog(input.value));
  });
  var refreshBtn = document.getElementById("refresh");
  if(refreshBtn){
    refreshBtn.addEventListener("click", loadLogData);
  }
});
