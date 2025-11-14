/**
 * TranslationDetector - 偵測網頁是否被翻譯
 */
class TranslationDetector {
  constructor(options = {}) {
    this.options = {
      checkInterval: options.checkInterval || 1000,
      watchDynamic: options.watchDynamic !== false,
      ...options
    };

    this.observer = null;
    this.intervalId = null;
    this.isTranslated = false;
    this.callbacks = {
      onDetected: [],
      onReverted: []
    };
  }

  /**
   * 開始監控翻譯
   */
  start() {
    this.setupMutationObserver();
    this.startPeriodicCheck();
    this.checkTranslationState();
  }

  /**
   * 停止監控
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 設置 MutationObserver 監控 DOM 變化
   */
  setupMutationObserver() {
    // 檢查 document.body 是否存在
    if (!document.body) {
      console.warn('Anti-Translate: document.body not available, retrying...');
      setTimeout(() => this.setupMutationObserver(), 100);
      return;
    }

    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;

      for (const mutation of mutations) {
        // 檢查屬性變化
        if (mutation.type === 'attributes') {
          if (this.isTranslationAttribute(mutation.attributeName)) {
            shouldCheck = true;
            break;
          }
        }

        // 檢查新增的節點
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (this.isTranslationNode(node)) {
              shouldCheck = true;
            }
          });
        }
      }

      if (shouldCheck) {
        this.checkTranslationState();
      }
    });

    this.observer.observe(document.body, {
      attributes: true,
      attributeOldValue: true,
      childList: true,
      subtree: true,
      attributeFilter: ['lang', 'translate', 'class']
    });
  }

  /**
   * 定期檢查翻譯狀態
   */
  startPeriodicCheck() {
    this.intervalId = setInterval(() => {
      this.checkTranslationState();
    }, this.options.checkInterval);
  }

  /**
   * 檢查當前翻譯狀態
   */
  checkTranslationState() {
    const wasTranslated = this.isTranslated;
    const detectionResults = {
      fontTags: this.detectFontTags(),
      langChange: this.detectLangChange(),
      translateAttr: this.detectTranslateAttribute(),
      translatedClass: this.detectTranslatedClass(),
      contentChange: this.detectContentChange()
    };

    // 如果任何一個偵測方法回傳 true，表示頁面被翻譯了
    this.isTranslated = Object.values(detectionResults).some(result => result);

    if (this.isTranslated && !wasTranslated) {
      // 剛被翻譯
      this.triggerCallbacks('onDetected', detectionResults);
    } else if (!this.isTranslated && wasTranslated) {
      // 翻譯被還原
      this.triggerCallbacks('onReverted');
    }

    return this.isTranslated;
  }

  /**
   * 偵測 Chrome 翻譯添加的 <font> 標籤
   * @returns {boolean}
   */
  detectFontTags() {
    // Chrome 翻譯會在文字外包裹 <font> 標籤
    const fontTags = document.querySelectorAll('font[class*="translat"]');
    return fontTags.length > 0;
  }

  /**
   * 偵測 lang 屬性變化
   * @returns {boolean}
   */
  detectLangChange() {
    if (!document.documentElement || !document.body) {
      return false;
    }

    const htmlLang = document.documentElement.getAttribute('lang');
    const bodyLang = document.body.getAttribute('lang');

    // 儲存原始語言
    if (!this.originalLang) {
      this.originalLang = htmlLang || bodyLang || '';
    }

    // 如果語言改變了，可能是被翻譯
    if (htmlLang && this.originalLang && htmlLang !== this.originalLang) {
      return true;
    }

    return false;
  }

  /**
   * 偵測 translate 屬性
   * @returns {boolean}
   */
  detectTranslateAttribute() {
    // 檢查是否有元素被標記為已翻譯
    const translatedElements = document.querySelectorAll('[translate="yes"]');
    return translatedElements.length > 0;
  }

  /**
   * 偵測翻譯相關的 class
   * @returns {boolean}
   */
  detectTranslatedClass() {
    // Google 翻譯會添加特定 class
    const classPatterns = [
      'translated-ltr',
      'translated-rtl',
      'translated',
      'goog-te-'
    ];

    for (const pattern of classPatterns) {
      const elements = document.querySelectorAll(`[class*="${pattern}"]`);
      if (elements.length > 0) return true;
    }

    return false;
  }

  /**
   * 偵測內容變化（較耗效能，謹慎使用）
   * @returns {boolean}
   */
  detectContentChange() {
    // 這個方法需要配合 ContentBackup 使用
    // 暫時返回 false
    return false;
  }

  /**
   * 檢查是否為翻譯相關的屬性
   * @param {string} attrName
   * @returns {boolean}
   */
  isTranslationAttribute(attrName) {
    const translationAttrs = ['lang', 'translate', 'class'];
    return translationAttrs.includes(attrName);
  }

  /**
   * 檢查是否為翻譯添加的節點
   * @param {Node} node
   * @returns {boolean}
   */
  isTranslationNode(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;

    // Chrome 翻譯常用 <font> 標籤
    if (node.tagName === 'FONT') return true;

    // 檢查是否有翻譯相關的 class
    if (node.className && typeof node.className === 'string') {
      return node.className.includes('translat') ||
             node.className.includes('goog-te-');
    }

    return false;
  }

  /**
   * 註冊回調函數
   * @param {string} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(callback);
    }
  }

  /**
   * 移除回調函數
   * @param {string} event
   * @param {Function} callback
   */
  off(event, callback) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index > -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  /**
   * 觸發回調函數
   * @param {string} event
   * @param {*} data
   */
  triggerCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Anti-Translate callback error:', error);
        }
      });
    }
  }

  /**
   * 取得當前翻譯狀態
   * @returns {boolean}
   */
  getTranslationState() {
    return this.isTranslated;
  }
}

export default TranslationDetector;
