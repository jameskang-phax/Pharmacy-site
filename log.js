/* ============================================================
   表單填寫紀錄預覽（通用版）
   ------------------------------------------------------------
   資料來源：Google 表單回覆試算表 → 發布到網路的 CSV → 網站讀取顯示
   使用方式：每個頁面在載入這個檔案「之前」，先設定：
     window.LOG_CSV_URL = "你的試算表CSV網址";
   欄位名稱會直接讀試算表的表頭列，不需要另外設定欄位對應。
   ============================================================ */

/* Google 表單的時間戳記格式為「2026/7/11 下午 4:17:41」，
   JavaScript 內建的 Date 解析看不懂中文的上午/下午，會直接判定成無效日期，導致排序失效。
   這個函式專門處理這種格式，回傳可以用來比較大小的毫秒數；若格式不符，退回原生解析當備援。 */
function parseZhTimestamp(str){
  if(!str) return 0;
  var s = String(str).trim();
  var m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(上午|下午)\s*(\d{1,2}):(\d{2}):(\d{2})$/);
  if(m){
    var year = +m[1], month = +m[2], day = +m[3], ampm = m[4];
    var hour = +m[5], min = +m[6], sec = +m[7];
    if(ampm === '下午' && hour < 12) hour += 12;
    if(ampm === '上午' && hour === 12) hour = 0;
    return new Date(year, month - 1, day, hour, min, sec).getTime();
  }
  var fallback = new Date(s).getTime();
  return isNaN(fallback) ? 0 : fallback;
}

/* 解析「效期」欄位，支援常見格式：2026.08、2026/08、2026-08、2026年8月
   回傳該月最後一天的毫秒數，方便跟現在時間比較；格式不符則回傳 null（不處理，維持原樣顯示） */
function parseExpiryDate(str){
  var s = String(str).trim();
  var m = s.match(/^(\d{4})[.\/\-年](\d{1,2})月?$/);
  if(!m) return null;
  var year = +m[1], month = +m[2];
  if(month < 1 || month > 12) return null;
  return new Date(year, month, 0).getTime();
}

/* 依效期毫秒數，判斷是否已過期或即將到期（6個月內），回傳 null 代表效期還久、不用特別提示 */
function expiryStatus(ms){
  if(ms === null || ms === undefined) return null;
  var now = Date.now();
  var sixMonthsLater = now + 1000 * 60 * 60 * 24 * 182;
  if(ms < now) return { label: '已過期', cls: 'log-expiry-expired' };
  if(ms < sixMonthsLater) return { label: '6個月內到期', cls: 'log-expiry-soon' };
  return null;
}

/* 判斷一筆紀錄裡，是否含有「效期」欄位且已過期或即將到期 */
function itemHasExpiryAlert(item){
  return item.fields.some(function(f){
    if(f.label.indexOf('效期') === -1) return false;
    return expiryStatus(parseExpiryDate(f.value)) !== null;
  });
}

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

/* 判斷一筆紀錄裡，是否含有「結案」欄位且已勾選／填寫（表示後台已標記為處理完畢）。
   對應 Google 表單／試算表新增的「結案」欄位：只要那一欄有內容，且不是「否、未、尚未」這類否定字，就視為已結案。
   欄位是空的，或整份資料根本沒有「結案」欄位，就一律視為未結案。 */
var NEGATIVE_RESOLVED_VALUES = ['否', '未', '尚未', '未結案', 'no', 'false', '0'];
function itemIsResolved(item){
  return item.fields.some(function(f){
    if(f.label.indexOf('結案') === -1) return false;
    var v = f.value.trim();
    if(!v) return false;
    return NEGATIVE_RESOLVED_VALUES.indexOf(v.toLowerCase()) === -1;
  });
}

var LOG_HEADERS = [];
var LOG_ITEMS = [];

function formatLogValue(value){
  var trimmed = value.trim();
  // 如果整個欄位是一個或多個網址（Google表單檔案上傳題會存成網址），
  // 就顯示成可點擊的附件連結，而不是純文字網址
  var parts = trimmed.split(',').map(function(s){ return s.trim(); }).filter(function(s){ return s !== ''; });
  var allUrls = parts.length > 0 && parts.every(function(p){ return /^https?:\/\//i.test(p); });
  if(allUrls){
    return parts.map(function(url, i){
      var label = parts.length > 1 ? ('📎 附件 ' + (i + 1)) : '📎 查看附件';
      return '<a href="' + escapeLogHtml(url) + '" target="_blank" rel="noopener" class="log-attachment">' + label + '</a>';
    }).join(' ');
  }
  return escapeLogHtml(value);
}

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
        var extra = '';
        if(f.label.indexOf('效期') > -1){
          var status = expiryStatus(parseExpiryDate(f.value));
          if(status) extra = ' <span class="log-expiry-badge ' + status.cls + '">' + status.label + '</span>';
        }
        return '<dt>' + escapeLogHtml(f.label) + '</dt><dd>' + formatLogValue(f.value) + extra + '</dd>';
      }).join('');

    var resolveHtml = '';
    var cardClass = 'log-item';
    if(itemIsResolved(item)){
      cardClass += ' is-resolved';
      resolveHtml = '<span class="log-resolve-badge">✓ 已結案</span>';
    }

    return '<div class="' + cardClass + '">' +
      '<div class="log-date">' + escapeLogHtml(item.ts) + resolveHtml + '</div>' +
      '<dl class="log-fields">' + fieldsHtml + '</dl>' +
    '</div>';
  }).join("");
}

var expiryOnlyMode = false;
var showResolvedMode = false;

function searchLog(keyword){
  var k = keyword.trim().toLowerCase();
  var base = LOG_ITEMS;
  if(k){
    base = base.filter(function(item){
      return item.ts.toLowerCase().includes(k) ||
        item.fields.some(function(f){ return String(f.value).toLowerCase().includes(k); });
    });
  }
  if(expiryOnlyMode){
    base = base.filter(itemHasExpiryAlert);
  }
  if(!showResolvedMode){
    base = base.filter(function(item){ return !itemIsResolved(item); });
  }
  return base;
}

/* 若這份資料含有「效期」或「結案」欄位，動態插入對應的篩選開關；
   沒有的話（例如其他表單）就不會出現，不用另外改 HTML */
function ensureExpiryFilterUI(){
  if(document.getElementById('expiry-filter-wrap')) return;
  var hasExpiryField = LOG_HEADERS.some(function(h){ return h.indexOf('效期') > -1; });
  var hasResolvedField = LOG_HEADERS.some(function(h){ return h.indexOf('結案') > -1; });
  if(!hasExpiryField && !hasResolvedField) return;

  var searchBox = document.querySelector('.search-box');
  var lastInserted = searchBox;

  if(hasExpiryField){
    var wrap = document.createElement('label');
    wrap.id = 'expiry-filter-wrap';
    wrap.className = 'expiry-filter-wrap';
    wrap.innerHTML = '<input type="checkbox" id="expiry-filter-checkbox"> 只顯示含即期／過期品項的紀錄';
    searchBox.parentNode.insertBefore(wrap, lastInserted.nextSibling);
    lastInserted = wrap;
    document.getElementById('expiry-filter-checkbox').addEventListener('change', function(e){
      expiryOnlyMode = e.target.checked;
      var input = document.getElementById('q');
      renderLogList(searchLog(input.value));
    });
  }

  if(hasResolvedField){
    /* 後台在試算表把「結案」欄位填上內容後，該筆紀錄預設會被隱藏，清單只留下還沒處理的。
       這個開關是給需要回頭查「已經結案的紀錄」時用的，預設不勾＝隱藏已結案。 */
    var resolvedWrap = document.createElement('label');
    resolvedWrap.id = 'show-resolved-wrap';
    resolvedWrap.className = 'expiry-filter-wrap';
    resolvedWrap.innerHTML = '<input type="checkbox" id="show-resolved-checkbox"> 顯示已結案的紀錄';
    searchBox.parentNode.insertBefore(resolvedWrap, lastInserted.nextSibling);
    document.getElementById('show-resolved-checkbox').addEventListener('change', function(e){
      showResolvedMode = e.target.checked;
      var input = document.getElementById('q');
      renderLogList(searchLog(input.value));
    });
  }
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

      LOG_ITEMS.sort(function(a, b){ return parseZhTimestamp(b.ts) - parseZhTimestamp(a.ts); });

      ensureExpiryFilterUI();

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
