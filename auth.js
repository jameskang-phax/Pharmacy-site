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

var STAFF_AUTH_CSV_URL = "REPLACE_WITH_YOUR_PASSCODE_SHEET_CSV_URL";
var STAFF_AUTH_STORAGE_KEY = "pharmacy-staff-authed";

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

function fetchCurrentPasscode(){
  return fetch(STAFF_AUTH_CSV_URL + (STAFF_AUTH_CSV_URL.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now())
    .then(function(res){
      if(!res.ok) throw new Error('network');
      return res.text();
    })
    .then(function(text){
      // 只取第一格內容，去除換行、引號、空白
      var first = text.split(/\r?\n/)[0] || '';
      return first.replace(/^"|"$/g, '').trim();
    });
}

function buildAuthOverlay(onSuccess){
  var overlay = document.createElement('div');
  overlay.className = 'staff-auth-overlay';
  overlay.innerHTML =
    '<div class="staff-auth-box">' +
      '<div class="staff-auth-icon">🔒</div>' +
      '<h2>員工專用區</h2>' +
      '<p>這個頁面僅供院內同仁使用，請輸入通行碼。</p>' +
      '<input type="password" id="staff-auth-input" placeholder="請輸入通行碼" autocomplete="off">' +
      '<button type="button" id="staff-auth-submit">進入</button>' +
      '<p class="staff-auth-error" id="staff-auth-error" style="display:none;">通行碼錯誤，請再試一次。</p>' +
      '<a href="index.html" class="staff-auth-back">返回首頁</a>' +
    '</div>';
  document.body.appendChild(overlay);

  var input = document.getElementById('staff-auth-input');
  var submitBtn = document.getElementById('staff-auth-submit');
  var errorEl = document.getElementById('staff-auth-error');

  function trySubmit(){
    var val = input.value.trim();
    if(!val) return;
    submitBtn.disabled = true;
    submitBtn.textContent = '確認中…';
    fetchCurrentPasscode().then(function(correctCode){
      submitBtn.disabled = false;
      submitBtn.textContent = '進入';
      if(!correctCode || correctCode.indexOf('REPLACE_WITH') === 0){
        errorEl.textContent = '尚未設定通行碼，請聯絡管理者完成設定。';
        errorEl.style.display = 'block';
        return;
      }
      if(val === correctCode){
        setStaffAuthed();
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

function requireStaffAuth(onSuccess){
  if(isStaffAuthed()){
    onSuccess();
    return;
  }
  buildAuthOverlay(onSuccess);
}

/* ============================================================
   進站選擇畫面：一打開網站就先問「訪客／員工」
   - 已經登入過的員工（localStorage 有記錄）→ 直接略過，不打擾
   - 選「訪客」→ 關閉畫面，正常瀏覽（各項功能仍會個別要求通行碼）
   - 選「員工」→ 直接跳出通行碼輸入框
   ============================================================ */
function showEntryGate(){
  if(isStaffAuthed()) return;

  var overlay = document.createElement('div');
  overlay.className = 'staff-auth-overlay';
  overlay.id = 'entry-gate-overlay';
  overlay.innerHTML =
    '<div class="staff-auth-box">' +
      '<div class="staff-auth-icon">🏥</div>' +
      '<h2>歡迎使用</h2>' +
      '<p>請選擇您的身分，以便顯示合適的內容。</p>' +
      '<button type="button" id="entry-staff-btn">我是員工，要登入</button>' +
      '<button type="button" id="entry-visitor-btn" class="staff-auth-secondary-btn">我是訪客，僅瀏覽</button>' +
    '</div>';
  document.body.appendChild(overlay);

  document.getElementById('entry-visitor-btn').addEventListener('click', function(){
    overlay.remove();
  });
  document.getElementById('entry-staff-btn').addEventListener('click', function(){
    overlay.remove();
    requireStaffAuth(function(){});
  });
}

/* ============================================================
   進站身分選擇（訪客／員工）
   ------------------------------------------------------------
   在公開頁面（首頁、衛教區）載入時顯示一次，讓使用者一開始
   就選擇自己的身分。選「員工」會直接接著跳出通行碼輸入。
   同一台裝置選過一次之後，這次瀏覽期間（分頁還開著）不會再問。
   ============================================================ */

var ROLE_SESSION_KEY = "pharmacy-role-picked";

function buildRoleGateOverlay(){
  var overlay = document.createElement('div');
  overlay.className = 'staff-auth-overlay';
  overlay.id = 'role-gate-overlay';
  overlay.innerHTML =
    '<div class="staff-auth-box role-gate-box">' +
      '<div class="staff-auth-icon">👋</div>' +
      '<h2>歡迎使用</h2>' +
      '<p>請選擇您的身分，訪客僅能瀏覽首頁與衛教區，員工可使用完整功能。</p>' +
      '<button type="button" class="role-btn role-btn-staff" id="role-btn-staff">🔑 我是員工</button>' +
      '<button type="button" class="role-btn role-btn-guest" id="role-btn-guest">👁 我是訪客（僅瀏覽）</button>' +
    '</div>';
  document.body.appendChild(overlay);

  document.getElementById('role-btn-guest').addEventListener('click', function(){
    try{ sessionStorage.setItem(ROLE_SESSION_KEY, 'guest'); }catch(e){}
    overlay.remove();
  });

  document.getElementById('role-btn-staff').addEventListener('click', function(){
    try{ sessionStorage.setItem(ROLE_SESSION_KEY, 'staff'); }catch(e){}
    overlay.remove();
    requireStaffAuth(function(){ /* 驗證通過即可，畫面本來就看得到公開內容 */ });
  });
}

function initRoleGate(){
  if(isStaffAuthed()) return; // 已經是驗證過的員工，不用再問
  try{
    if(sessionStorage.getItem(ROLE_SESSION_KEY)) return; // 這次瀏覽已經選過
  }catch(e){}
  buildRoleGateOverlay();
}

document.addEventListener('DOMContentLoaded', initRoleGate);
