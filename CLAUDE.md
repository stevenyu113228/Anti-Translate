# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

Anti-Translate 是一個用於偵測和防止網頁被瀏覽器翻譯的 JavaScript Library。核心功能包括：
1. 偵測網頁是否被翻譯（detect mode）
2. 自動還原被翻譯的網頁（prevent mode）
3. 支援動態內容（Ajax、React、Vue 等框架）

## 開發指令

### 建置專案
```bash
npm run build
```
使用 Rollup 打包，產生三種格式：
- `dist/anti-translate.js` - UMD 格式（未壓縮）
- `dist/anti-translate.min.js` - UMD 格式（已壓縮）
- `dist/anti-translate.esm.js` - ES Module 格式

### 開發模式
```bash
npm run dev
```
啟動 Rollup watch 模式，自動重新編譯。

### 本地測試
```bash
npm run serve
```
啟動 HTTP Server 在 port 8080，然後訪問 `http://localhost:8080/examples/demo.html`

## 專案架構

### 核心模組 (`src/core/`)

**content-backup.js**
- 負責備份網頁原始內容
- 使用 `WeakMap` 儲存元素的原始狀態
- 使用 `Map` 儲存文字節點的快照
- 提供內容校驗（checksum）功能

**detector.js**
- 使用 `MutationObserver` 監控 DOM 變化
- 實作多種翻譯偵測機制：
  - `detectFontTags()` - 偵測 Chrome 翻譯添加的 `<font>` 標籤
  - `detectLangChange()` - 偵測 `lang` 屬性變化
  - `detectTranslateAttribute()` - 偵測 `translate` 屬性
  - `detectTranslatedClass()` - 偵測翻譯相關的 class（如 `translated-ltr`）
- 支援事件回調（`onDetected`, `onReverted`）

**reverter.js**
- 負責還原被翻譯的內容
- 主要方法：
  - `removeTranslationElements()` - 移除翻譯器添加的元素（如 `<font>` 標籤）
  - `restoreAttributes()` - 還原被修改的屬性
  - `smartRevert()` - 智能還原，只還原被翻譯的部分

### UI 模組 (`src/ui/`)

**warning-modal.js**
- 顯示翻譯警告彈窗
- 純 JavaScript 實作，包含內聯 CSS
- 支援自訂訊息和按鈕文字
- 提供還原按鈕回調功能

### 主要入口 (`src/index.js`)

整合所有模組，提供統一的 API：
- `init(options)` - 初始化並開始監控
- `startWatch()` - 開始監控
- `stopWatch()` - 停止監控
- `revert()` - 手動還原
- `checkTranslation()` - 檢查翻譯狀態
- `isTranslated()` - 取得翻譯狀態
- `updateConfig(options)` - 更新設定
- `destroy()` - 銷毀實例

## 關鍵技術細節

### 翻譯偵測原理

不同瀏覽器的翻譯機制：
1. **Google Chrome**: 在文字外包裹 `<font>` 標籤，並添加特定 class
2. **通用特徵**: 修改 `lang` 屬性、添加 `translate` 屬性、添加翻譯相關的 class

### MutationObserver 使用

監控以下類型的 DOM 變化：
- `attributes: true` - 監控屬性變化（lang, translate, class）
- `childList: true` - 監控子節點變化
- `subtree: true` - 監控整個子樹

### 效能考量

1. 使用 `WeakMap` 避免記憶體洩漏
2. 使用節流機制限制檢查頻率（`checkInterval` 預設 1000ms）
3. 只監控關鍵屬性變化，避免過度觸發

## 測試方式

1. 開啟 `examples/demo.html`
2. 點擊「啟動偵測模式」或「啟動防護模式」
3. 使用瀏覽器翻譯功能翻譯頁面：
   - Chrome: 右鍵 → 翻譯為...
   - 或直接在網址列使用翻譯功能
4. 觀察 Anti-Translate 的反應

## 注意事項

### 開發新功能時

1. **新增偵測方法**: 在 `detector.js` 的 `TranslationDetector` class 中新增 `detectXXX()` 方法，並在 `checkTranslationState()` 中調用
2. **修改還原邏輯**: 在 `reverter.js` 的 `TranslationReverter` class 中修改
3. **更新 API**: 在 `index.js` 的 `AntiTranslate` class 中新增方法

### 相容性考量

- 確保支援 ES6（可使用 Babel 轉譯）
- MutationObserver API 為必要依賴
- WeakMap 為必要依賴

### 動態內容支援

使用 `MutationObserver` 監控新增的節點，自動為動態內容設置監控。對於 React/Vue 等框架：
- 監控會自動涵蓋虛擬 DOM 渲染後的實際 DOM
- 不需要特別處理框架層面的邏輯

## 常見問題

**Q: 為什麼有時候偵測不到翻譯？**
A: 不同瀏覽器的翻譯機制可能不同，需要針對性添加偵測方法。

**Q: 還原功能會不會影響正常的動態內容？**
A: `smartRevert()` 會檢查內容差異程度，只還原明顯被翻譯的部分（長度差異 > 10%）。

**Q: 如何支援新的瀏覽器翻譯機制？**
A: 在 `detector.js` 中新增對應的偵測方法，並在 `reverter.js` 中新增還原邏輯。
