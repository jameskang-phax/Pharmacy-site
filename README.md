# 藥劑科工作站

一個放在 GitHub Pages 上的科內入口網頁，包含：

- 三個表單入口（連結到 Google 表單）
- 一個藥品電子檔查詢頁面（純網頁，資料寫在 `script.js` 裡）

不需要任何伺服器、資料庫或程式安裝，全部都是靜態網頁。

---

## 第一步：把這個資料夾放上 GitHub

1. 到 [github.com](https://github.com) 註冊/登入帳號
2. 點右上角 `+` → `New repository`
3. Repository name 填 `pharmacy-site`（或任何你喜歡的名字），Visibility 選 **Public**（GitHub Pages 免費方案需要公開 repo）
4. 建立好後，把這個資料夾裡所有檔案上傳：
   - 進到 repo 頁面 → `Add file` → `Upload files`
   - 把 `index.html`、`drugs.html`、`script.js`、`styles.css`、`README.md` 拖進去
   - 下方填寫說明文字（例如「初版上傳」），按 `Commit changes`

## 第二步：開啟 GitHub Pages

1. 在 repo 頁面點上方 `Settings`
2. 左側選單找到 `Pages`
3. 「Build and deployment」→ Source 選 `Deploy from a branch`
4. Branch 選 `main`，資料夾選 `/ (root)`，按 `Save`
5. 等 1-2 分鐘，重新整理頁面，會出現一個網址，長得像：
   `https://你的帳號.github.io/pharmacy-site/`
6. 打開這個網址，就會看到剛剛做好的入口頁面

之後只要在 GitHub 上編輯檔案並存檔（Commit），網站會自動更新，不需要重新部署。

---

## 第三步：建立 3 個 Google 表單，換上正式連結

到 [Google 表單](https://forms.google.com) 分別建立以下三個表單，建立好之後點右上角 **傳送** → 選 🔗 連結圖示 → 複製網址。

### 表單一：藥物諮詢紀錄表（建議欄位）

| 欄位 | 類型建議 |
|---|---|
| 填表日期 / 時間 | 日期、時間 |
| 填表藥師 | 簡答 |
| 諮詢對象 | 選擇題：病人 / 家屬 / 醫護同仁 |
| 諮詢方式 | 選擇題：櫃檯 / 電話 / 病房訪視 |
| 涉及藥品名稱 | 簡答 |
| 諮詢問題內容 | 段落 |
| 回覆重點 | 段落 |
| 是否需追蹤 | 是 / 否 |

### 表單二：調劑錯誤紀錄表（建議欄位）

| 欄位 | 類型建議 |
|---|---|
| 發生日期 / 時間 | 日期、時間 |
| 發現階段 | 選擇題：調劑時 / 核對時 / 發藥前 / 病人服用後 |
| 錯誤類型 | 選擇題：藥品錯誤 / 劑量錯誤 / 途徑錯誤 / 病人錯誤 / 其他 |
| 錯誤描述 | 段落 |
| 是否已到病人端 | 是 / 否 |
| 初步原因分析 | 段落 |
| 改善建議 | 段落 |
| 通報人 | 簡答（可設定選填以鼓勵通報） |

> 若醫院已有既定的用藥錯誤/不良事件通報系統或需符合病人安全通報法規，建議先與品管/風管單位確認，這份表單可作為科內初步紀錄用。

### 表單三：5S 查核表（建議欄位）

| 欄位 | 類型建議 |
|---|---|
| 稽核日期 | 日期 |
| 稽核區域 | 簡答（例如：調劑台 / 藥庫 / 諮詢窗口） |
| 整理（不要的東西已清除） | 是 / 否 / 部分符合 |
| 整頓（物品定位、標示清楚） | 是 / 否 / 部分符合 |
| 清掃（環境整潔無髒污） | 是 / 否 / 部分符合 |
| 清潔（清掃狀態能否維持） | 是 / 否 / 部分符合 |
| 素養（同仁確實遵守規範） | 是 / 否 / 部分符合 |
| 缺失事項 | 段落 |
| 稽核人 | 簡答 |

---

建立好三個表單後，打開 `index.html`，把裡面的：

```html
https://forms.gle/REPLACE_WITH_YOUR_FORM_1
https://forms.gle/REPLACE_WITH_YOUR_FORM_2
https://forms.gle/REPLACE_WITH_YOUR_FORM_3
```

換成你實際的三個表單連結，存檔上傳即可。

---

## 第四步：維護藥品電子檔

藥品資料寫在 `script.js` 最上方的 `DRUGS` 陣列裡，格式如下：

```js
{
  code: "AMX-001",              // 內部代碼，自訂即可
  generic: "Amoxicillin",       // 學名
  brand: "安莫西林膠囊",          // 商品名
  form: "膠囊 250mg / 500mg",    // 劑型劑量
  route: "口服",                 // 給藥途徑
  use: "細菌感染（呼吸道、泌尿道、皮膚等）",
  sideEffect: "腹瀉、噁心、皮疹",
  warning: "青黴素過敏者禁用",
  storage: "室溫，避光"
}
```

**新增藥品**：複製一整組 `{ ... }`，貼在陣列裡（記得中間用逗號分隔），修改內容後存檔。
**修改/刪除藥品**：直接找到對應那一組文字修改或刪除即可。

在 GitHub 網頁上編輯：進到 repo → 點 `script.js` → 右上角鉛筆圖示 → 修改 → 下方 `Commit changes`。不需要在自己電腦安裝任何軟體。

---

## 第五步：維護「用藥衛教區」（圖片＋影片）

衛教區的頁面是 `education.html`，裡面每一個主題是一張卡片，長這樣：

```html
<article class="edu-card">
  <div class="edu-media">
    <img src="images/edu-inhaler.jpg" alt="吸入劑正確使用步驟示意圖">
  </div>
  <div class="edu-body">
    <span class="code">ED-01</span>
    <h3>吸入劑正確使用步驟</h3>
    <div class="edu-tags"><span>氣喘</span><span>慢性阻塞性肺病</span></div>
    <p>示範定量吸入劑（MDI）的正確操作順序…</p>
    <div class="video-wrap">
      <iframe
        src="https://www.youtube.com/embed/REPLACE_WITH_VIDEO_ID_1"
        title="吸入劑使用教學影片"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
  </div>
</article>
```

### 圖片怎麼放上去？

1. 準備好圖片檔（建議用 `.jpg`，檔案不要太大，單張建議 500KB 以下，手機拍照後可用「編輯」功能先壓縮或裁切）
2. 到 GitHub repo 頁面 → 點 **Add file** → **Upload files**
3. 上傳前，先在檔名前面加上資料夾名稱，例如把檔名改成 `images/edu-inhaler.jpg`（GitHub 網頁上傳時，只要檔名有 `/`，就會自動建立資料夾），或是先建立好 `images` 資料夾再把檔案丟進去
4. Commit 存檔後，回到 `education.html`，把對應卡片的 `src="images/xxx.jpg"` 換成你剛剛上傳的檔名

### 影片怎麼放上去？

**強烈建議用 YouTube，不要把影片檔直接上傳到 GitHub**（GitHub 對大檔案、影片檔案不友善，容易上傳失敗或拖慢網站）。

1. 把影片上傳到 YouTube，若不想公開讓所有人在 YouTube 搜尋到，上傳時選 **「不公開／Unlisted」**（只有拿到連結的人看得到，不會出現在搜尋結果或你的頻道列表）
2. 上傳好後，打開影片，點**分享** → 複製連結，網址長得像：
   `https://www.youtube.com/watch?v=AbCdEfGhIjK`
3. 把裡面 `v=` 後面那串 `AbCdEfGhIjK` 複製下來，這就是「影片 ID」
4. 回到 `education.html`，把對應卡片裡的 `REPLACE_WITH_VIDEO_ID_1` 換成這串影片 ID 即可

### 新增一個全新的衛教主題

複製整個 `<article class="edu-card"> … </article>` 區塊，貼在最後一個 `</article>` 後面、`</div>` (`edu-grid` 結束) 之前，修改：
- `<span class="code">` 裡的編號（例如 `ED-04`）
- `<h3>` 標題
- `<div class="edu-tags">` 裡的分類標籤（可增減 `<span>`）
- `<p>` 說明文字
- 圖片 `src`
- 如果沒有影片，把整個 `<div class="video-wrap">…</div>` 刪掉即可，只留圖片＋文字

---

## 第六步：設定「藥劑科公告事項」（全院共享）

公告事項的運作方式是：**Google 表單（讓大家填公告）→ 自動產生的 Google 試算表（存資料）→ 發布成網路上的 CSV → 網站讀取顯示**。設定一次之後，之後同仁只要填表單，公告就會自動出現在網站上，全院都看得到同一份。

### 1. 建立公告用的 Google 表單

到 [Google 表單](https://forms.google.com) 建立一個新表單，欄位建議：

| 欄位 | 類型 |
|---|---|
| 公告標題 | 簡答（設為必填） |
| 公告內容 | 段落（選填） |

表單會自動記錄「時間戳記」，不用另外加欄位。

### 2. 取得表單的填寫連結

點右上角 **傳送** → 🔗 連結圖示 → 勾選「縮短網址」→ 複製，會拿到類似 `forms.gle/xxxxx` 的網址。

### 3. 建立對應的回覆試算表

在表單編輯畫面，點上方 **回覆** 分頁 → 右上角的**綠色試算表圖示** → 建立新試算表。這樣以後每次有人填表單，資料就會自動新增一列到這份試算表。

### 4. 把試算表發布成網路可讀的 CSV

1. 打開剛剛建立的試算表
2. 點選單 **檔案 → 共用 → 發布到網路**（英文介面是 File → Share → Publish to web）
3. 選擇要發布的工作表（通常是「表單回應 1」），格式選 **逗號分隔值檔案 (.csv)**
4. 點 **發布**，確認後會拿到一個網址，長得像：
   `https://docs.google.com/spreadsheets/d/e/2PACX-xxxxxxxx/pub?output=csv`
5. 複製這個網址

### 5. 把兩個網址填回網站

打開 `index.html`：

- 找到 `REPLACE_WITH_YOUR_ANNOUNCE_FORM`，換成步驟 2 拿到的表單連結
- 找到 `REPLACE_WITH_YOUR_SHEET_CSV_URL`，換成步驟 4 拿到的 CSV 網址

存檔上傳後，公告區塊就會自動抓取試算表的資料顯示在網站上。

### 使用上的小提醒

- 同仁點「新增公告」會開新分頁去填 Google 表單，填完送出後，公告會出現在試算表裡
- 網站每次打開頁面，或按「重新整理」按鈕，都會重新抓取一次最新資料
- Google 試算表「發布到網路」的內容大約每 1-5 分鐘才會更新一次快取，所以剛送出的公告可能要等一下下才會顯示，這是 Google 那邊的機制，不是網站故障
- 如果想刪除或修改某則公告，直接到那份 Google 試算表裡編輯或刪除那一列即可，網站會自動同步顯示最新內容

---

## 關於病人資料的提醒

- 「藥物諮詢紀錄表」如果會填寫病人姓名、病歷號等可識別個資，請先確認是否符合院內個資保護規範與資安政策，是否適合使用 Google 表單收集。
- 這個 GitHub Pages 網頁本身只是「入口頁面」，不會經手或儲存任何病人資料，資料實際收集與儲存都在 Google 表單/試算表那一端。
- 建議在表單中盡量以「病歷號」取代姓名，並設定表單的存取權限（例如僅限院內 Google 帳號填寫）。

---

## 檔案結構

```
pharmacy-site/
├── index.html       # 首頁，表單與查詢入口
├── drugs.html       # 藥品電子檔查詢頁
├── education.html   # 用藥衛教區（圖片＋影片）
├── script.js        # 藥品資料 + 搜尋邏輯
├── styles.css       # 共用樣式
├── images/          # 衛教區用的圖片（自行上傳）
└── README.md        # 本說明文件
```
