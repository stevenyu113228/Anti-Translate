/**
 * Anti-Translate
 * 防止網頁被翻譯的 JavaScript Library
 *
 * @author Steven
 * @version 1.0.0
 */

import ContentBackup from './core/content-backup.js';
import TranslationDetector from './core/detector.js';
import TranslationReverter from './core/reverter.js';
import WarningModal from './ui/warning-modal.js';

class AntiTranslate {
  constructor() {
    this.config = {
      mode: 'detect',              // 'detect' | 'prevent'
      showWarning: true,            // 是否顯示警告彈窗
      warningMessage: '偵測到網頁已被翻譯，請留意內容的正確性。',
      autoRevert: false,            // 是否自動還原
      checkInterval: 1000,          // 檢查間隔（毫秒）
      watchDynamic: true,           // 監控動態內容
      onDetected: null,             // 偵測到翻譯時的回調
      onReverted: null              // 還原後的回調
    };

    this.contentBackup = null;
    this.detector = null;
    this.reverter = null;
    this.modal = null;
    this.isInitialized = false;
  }

  /**
   * 初始化 Anti-Translate
   * @param {Object} options 設定選項
   */
  init(options = {}) {
    if (this.isInitialized) {
      console.warn('Anti-Translate: Already initialized');
      return this;
    }

    // 合併設定
    this.config = { ...this.config, ...options };

    // 等待 DOM 載入完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setup();
      });
    } else {
      this.setup();
    }

    return this;
  }

  /**
   * 設置各個模組
   */
  setup() {
    // 初始化內容備份
    this.contentBackup = new ContentBackup();
    this.contentBackup.init();

    // 初始化偵測器
    this.detector = new TranslationDetector({
      checkInterval: this.config.checkInterval,
      watchDynamic: this.config.watchDynamic
    });

    // 初始化還原器（傳入 detector 以存取 originalLang）
    this.reverter = new TranslationReverter(this.contentBackup, this.detector);

    // 初始化警告彈窗
    if (this.config.showWarning) {
      this.modal = new WarningModal({
        message: this.config.warningMessage,
        showRevertButton: true
      });

      // 設置還原按鈕的回調
      this.modal.onRevert(() => {
        this.revert();
      });
    }

    // 註冊偵測回調
    this.detector.on('onDetected', (detectionResults) => {
      this.handleTranslationDetected(detectionResults);
    });

    this.detector.on('onReverted', () => {
      this.handleTranslationReverted();
    });

    // 根據模式啟動
    if (this.config.mode === 'prevent' || this.config.mode === 'detect') {
      this.startWatch();
    }

    this.isInitialized = true;
    console.log('Anti-Translate: Initialized successfully');
  }

  /**
   * 處理翻譯被偵測到的情況
   * @param {Object} detectionResults
   */
  handleTranslationDetected(detectionResults) {
    console.log('Anti-Translate: Translation detected', detectionResults);

    // 顯示警告
    if (this.config.showWarning && this.modal && !this.modal.isShown()) {
      this.modal.show();
    }

    // 自動還原
    if (this.config.autoRevert || this.config.mode === 'prevent') {
      this.revert();
    }

    // 觸發用戶定義的回調
    if (typeof this.config.onDetected === 'function') {
      this.config.onDetected(detectionResults);
    }
  }

  /**
   * 處理翻譯被還原的情況
   */
  handleTranslationReverted() {
    console.log('Anti-Translate: Translation reverted');

    // 觸發用戶定義的回調
    if (typeof this.config.onReverted === 'function') {
      this.config.onReverted();
    }
  }

  /**
   * 開始監控翻譯
   */
  startWatch() {
    if (!this.detector) {
      console.error('Anti-Translate: Not initialized');
      return this;
    }

    this.detector.start();
    console.log('Anti-Translate: Started watching');
    return this;
  }

  /**
   * 停止監控翻譯
   */
  stopWatch() {
    if (!this.detector) {
      console.error('Anti-Translate: Not initialized');
      return this;
    }

    this.detector.stop();
    console.log('Anti-Translate: Stopped watching');
    return this;
  }

  /**
   * 手動還原翻譯
   */
  revert() {
    if (!this.reverter) {
      console.error('Anti-Translate: Not initialized');
      return this;
    }

    this.reverter.smartRevert();
    return this;
  }

  /**
   * 手動檢查翻譯狀態
   * @returns {boolean}
   */
  checkTranslation() {
    if (!this.detector) {
      console.error('Anti-Translate: Not initialized');
      return false;
    }

    return this.detector.checkTranslationState();
  }

  /**
   * 取得當前翻譯狀態
   * @returns {boolean}
   */
  isTranslated() {
    if (!this.detector) {
      return false;
    }

    return this.detector.getTranslationState();
  }

  /**
   * 更新設定
   * @param {Object} options
   */
  updateConfig(options = {}) {
    this.config = { ...this.config, ...options };

    // 更新警告訊息
    if (this.modal && options.warningMessage) {
      this.modal.updateMessage(options.warningMessage);
    }

    return this;
  }

  /**
   * 銷毀實例
   */
  destroy() {
    if (this.detector) {
      this.detector.stop();
    }

    if (this.modal && this.modal.isShown()) {
      this.modal.hide();
    }

    if (this.contentBackup) {
      this.contentBackup.clear();
    }

    this.isInitialized = false;
    console.log('Anti-Translate: Destroyed');
  }
}

// 建立全域實例
const antiTranslateInstance = new AntiTranslate();

// 如果在瀏覽器環境中，將實例掛載到 window
if (typeof window !== 'undefined') {
  window.AntiTranslate = antiTranslateInstance;
}

// 支援 ES6 模組
export default antiTranslateInstance;

// 支援 CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = antiTranslateInstance;
}
