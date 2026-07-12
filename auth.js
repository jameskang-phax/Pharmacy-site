/* ============================================================
   員工通行碼驗證（共用邏輯）
   ------------------------------------------------------------
   密碼存放在一份 Google 試算表的其中一格，發布成 CSV 讓網站讀取。
   員工要換密碼，直接改那個儲存格就好，不用改網站程式碼。

   使用方式：在需要保護的頁面裡呼叫
     requireStaffAuth(function(){ ...驗證通過後要做的事... });

   ⚠️ 重要提醒（誠實告知限制）：
   這只是「擋一般訪客」用的簡單通行碼，不是真正安全的登入系統。
   密碼本身會透過網路請求被讀取，技術上懂得檢查瀏覽器工具的人
   還是看得到。不適合用來保護病人隱私資料或機密內容，只適合
   用來降低一般人誤入表單/查詢功能的機率。
   ============================================================ */

var STAFF_AUTH_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTLWqS1Aw96H7VppVxoiVIklNzOibHqk8QnxNqgblHjrlYgHWz8ISGntSlOqyM-nZZ4NWmrk2HGhCCN/pub?output=csv";
var STAFF_AUTH_STORAGE_KEY = "pharmacy-staff-authed";
var STAFF_NAME_STORAGE_KEY = "pharmacy-staff-name";
var ROLE_PICKED_STORAGE_KEY = "pharmacy-role-picked";

function isStaffAuthed(){
  try{
    return localStorage.getItem(STAFF_AUTH_STORAGE_KEY) === "yes";
  }catch(e){
    return false;
  }
}

function setStaffAuthed(){
  try{ localStorage.setItem(STAFF_AUTH_STORAGE_KEY, "yes"); }catch(e){}
}

function getStaffName(){
  try{ return localStorage.getItem(STAFF_NAME_STORAGE_KEY) || ''; }catch(e){ return ''; }
}

function setStaffName(name){
  try{ localStorage.setItem(STAFF_NAME_STORAGE_KEY, name); }catch(e){}
}

function hasPickedRole(){
  try{ return !!localStorage.getItem(ROLE_PICKED_STORAGE_KEY); }catch(e){ return false; }
}

function setPickedRole(role){
  try{ localStorage.setItem(ROLE_PICKED_STORAGE_KEY, role); }catch(e){}
}

function parseAuthCSV(text){
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

/* 抓取「通行碼對照表」：A 欄＝密碼，B 欄＝姓名，可以有很多列（多組通行碼） */
function fetchStaffList(){
  return fetch(STAFF_AUTH_CSV_URL + (STAFF_AUTH_CSV_URL.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now())
    .then(function(res){
      if(!res.ok) throw new Error('network');
      return res.text();
    })
    .then(function(text){
      var rows = parseAuthCSV(text);
      return rows.map(function(r){
        return {
          code: (r[0] || '').trim(),
          name: (r[1] || '').trim()
        };
      }).filter(function(r){ return r.code !== ''; });
    });
}

/* 頁面上顯示登出按鈕，找得到 #staff-greeting-slot 才會顯示；登入後不顯示姓名，只留登出按鈕 */
function renderStaffGreeting(){
  var slot = document.getElementById('staff-greeting-slot');
  if(!slot) return;
  var name = getStaffName();
  if(name && isStaffAuthed()){
    slot.innerHTML = '';
    var logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.className = 'staff-logout-btn';
    logoutBtn.textContent = '登出';
    logoutBtn.addEventListener('click', function(e){
      e.stopPropagation();
      logoutStaff();
    });
    slot.appendChild(logoutBtn);
    slot.style.display = 'inline-flex';
  }else{
    slot.innerHTML = '';
    slot.style.display = 'none';
  }
}

/* 登出：清除本機儲存的員工驗證狀態，但保留「訪客」身分，直接回到可瀏覽畫面，不再詢問身分 */
function logoutStaff(){
  try{
    localStorage.removeItem(STAFF_AUTH_STORAGE_KEY);
    localStorage.removeItem(STAFF_NAME_STORAGE_KEY);
    setPickedRole('guest');
  }catch(e){}
  window.location.href = 'index.html';
}

/* 通行碼輸入畫面：先顯示「僅供員工使用」提示，按鈕後才出現輸入框 */
function buildAuthOverlay(onSuccess){
  var overlay = document.createElement('div');
  overlay.className = 'staff-auth-overlay';

  function renderPrompt(){
    overlay.innerHTML =
      '<div class="staff-auth-box">' +
        '<div class="staff-auth-icon">🔒</div>' +
        '<h2>僅供員工使用</h2>' +
        '<p>這個功能僅供院內同仁使用，請以員工身分登入。</p>' +
        '<button type="button" id="staff-auth-goto-login">員工登入</button>' +
        '<a href="index.html" class="staff-auth-back">返回首頁</a>' +
      '</div>';
    document.getElementById('staff-auth-goto-login').addEventListener('click', renderLoginForm);
  }

  function renderLoginForm(){
    overlay.innerHTML =
      '<div class="staff-auth-box">' +
        '<div class="staff-auth-icon">🔑</div>' +
        '<h2>員工登入</h2>' +
        '<p>請輸入通行碼（格式：R + 身分證後 4 碼）</p>' +
        '<input type="password" id="staff-auth-input" placeholder="例如：R1234" autocomplete="off">' +
        '<button type="button" id="staff-auth-submit">進入</button>' +
        '<p class="staff-auth-error" id="staff-auth-error" style="display:none;"></p>' +
        '<a href="index.html" class="staff-auth-back">返回首頁</a>' +
      '</div>';

    var input = document.getElementById('staff-auth-input');
    var submitBtn = document.getElementById('staff-auth-submit');
    var errorEl = document.getElementById('staff-auth-error');

    function trySubmit(){
      var val = input.value.trim();
      if(!val) return;
      submitBtn.disabled = true;
      submitBtn.textContent = '確認中…';
      fetchStaffList().then(function(list){
        submitBtn.disabled = false;
        submitBtn.textContent = '進入';
        if(!list || list.length === 0){
          errorEl.textContent = '尚未設定通行碼，請聯絡管理者完成設定。';
          errorEl.style.display = 'block';
          return;
        }
        var matched = list.filter(function(item){ return item.code === val; })[0];
        if(matched){
          setStaffAuthed();
          setPickedRole('staff');
          setStaffName(matched.name || '');
          renderStaffGreeting();
          overlay.remove();
          onSuccess();
        }else{
          errorEl.textContent = '通行碼錯誤，請再試一次。';
          errorEl.style.display = 'block';
          input.value = '';
          input.focus();
        }
      }).catch(function(){
        submitBtn.disabled = false;
        submitBtn.textContent = '進入';
        errorEl.textContent = '無法連線驗證，請確認網路連線後再試一次。';
        errorEl.style.display = 'block';
      });
    }

    submitBtn.addEventListener('click', trySubmit);
    input.addEventListener('keydown', function(e){
      if(e.key === 'Enter') trySubmit();
    });
    setTimeout(function(){ input.focus(); }, 100);
  }

  document.body.appendChild(overlay);
  renderPrompt();
}

function requireStaffAuth(onSuccess){
  if(isStaffAuthed()){
    onSuccess();
    return;
  }
  buildAuthOverlay(onSuccess);
}

/* 進站身分選擇（訪客／員工），只在首頁呼叫一次；選過就不再問 */
function showEntryGate(){
  if(isStaffAuthed() || hasPickedRole()) return;

  var overlay = document.createElement('div');
  overlay.className = 'staff-auth-overlay';
  overlay.innerHTML =
    '<div class="staff-auth-box">' +
      '<div class="staff-auth-icon">👋</div>' +
      '<h2>歡迎使用</h2>' +
      '<p>請選擇您的身分，訪客僅能瀏覽首頁與衛教區，員工可使用完整功能。</p>' +
      '<button type="button" id="entry-staff-btn">🔑 我是員工</button>' +
      '<button type="button" id="entry-visitor-btn" class="staff-auth-secondary-btn">👁 我是訪客（僅瀏覽）</button>' +
    '</div>';
  document.body.appendChild(overlay);

  document.getElementById('entry-visitor-btn').addEventListener('click', function(){
    setPickedRole('guest');
    overlay.remove();
  });
  document.getElementById('entry-staff-btn').addEventListener('click', function(){
    overlay.remove();
    requireStaffAuth(function(){});
  });
}

document.addEventListener('DOMContentLoaded', renderStaffGreeting);
