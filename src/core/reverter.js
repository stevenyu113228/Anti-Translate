/**
 * TranslationReverter - 還原被翻譯的網頁內容
 */
class TranslationReverter {
  constructor(contentBackup, detector = null) {
    this.contentBackup = contentBackup;
    this.detector = detector;
    this.isReverting = false;
  }

  /**
   * 還原整個頁面
   */
  revert() {
    if (this.isReverting) {
      console.warn('Anti-Translate: Already reverting...');
      return;
    }

    this.isReverting = true;

    try {
      // 方法 1: 移除翻譯添加的元素
      this.removeTranslationElements();

      // 方法 2: 還原被修改的屬性
      this.restoreAttributes();

      // 方法 3: 重新載入頁面（激進方式）
      // this.forceReload();

      console.log('Anti-Translate: Page reverted successfully');
    } catch (error) {
      console.error('Anti-Translate: Error reverting page:', error);
    } finally {
      this.isReverting = false;
    }
  }

  /**
   * 移除翻譯器添加的元素和標記
   */
  removeTranslationElements() {
    // 移除 Google 翻譯添加的 <font> 標籤
    const fontTags = document.querySelectorAll('font[class*="translat"]');
    fontTags.forEach(font => {
      // 將 <font> 標籤的內容提取出來，替換掉 <font> 標籤本身
      const parent = font.parentNode;
      if (parent) {
        const textContent = font.textContent;
        const textNode = document.createTextNode(textContent);
        parent.replaceChild(textNode, font);
      }
    });

    // 移除其他翻譯相關的元素（但不包括 body 和 html）
    const translationSelectors = [
      '[class*="goog-te-"]',
      '.skiptranslate'
    ];

    translationSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        // 跳過 body、html 等特殊元素，這些元素不應該被移除
        if (element === document.body || element === document.documentElement || element === document.head) {
          return;
        }

        // 如果是包裝元素，提取內容
        if (element.children.length > 0) {
          const parent = element.parentNode;
          if (parent && parent !== document) {
            while (element.firstChild) {
              parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
          }
        } else {
          element.remove();
        }
      });
    });
  }

  /**
   * 還原被修改的屬性
   */
  restoreAttributes() {
    // 還原 html 和 body 的 lang 屬性
    if (this.detector && this.detector.originalLang !== undefined) {
      const originalLang = this.detector.originalLang;
      if (document.documentElement) {
        if (originalLang) {
          document.documentElement.setAttribute('lang', originalLang);
        } else {
          document.documentElement.removeAttribute('lang');
        }
      }
      if (document.body) {
        if (originalLang) {
          document.body.setAttribute('lang', originalLang);
        } else {
          document.body.removeAttribute('lang');
        }
      }
    }

    // 移除 translated-ltr 和 translated-rtl 類別
    if (document.body) {
      document.body.classList.remove('translated-ltr', 'translated-rtl');
    }

    // 移除 translate 屬性
    const translatedElements = document.querySelectorAll('[translate="yes"]');
    translatedElements.forEach(element => {
      element.removeAttribute('translate');
    });

    // 還原所有備份的元素
    this.contentBackup.elementSnapshots.forEach((snapshot, element) => {
      try {
        // 還原 lang 屬性
        if (snapshot.lang) {
          element.setAttribute('lang', snapshot.lang);
        } else {
          element.removeAttribute('lang');
        }

        // 檢查內容是否被修改
        if (element.innerHTML !== snapshot.innerHTML) {
          // 只在內容明顯不同時才還原，避免破壞動態內容
          const currentLength = element.innerHTML.length;
          const originalLength = snapshot.innerHTML.length;
          const lengthDiff = Math.abs(currentLength - originalLength) / originalLength;

          // 如果長度差異超過 10%，可能是被翻譯了
          if (lengthDiff > 0.1) {
            element.innerHTML = snapshot.innerHTML;
          }
        }
      } catch (error) {
        console.warn('Anti-Translate: Error restoring element:', error);
      }
    });
  }

  /**
   * 移除翻譯器添加的 class
   */
  removeTranslationClasses() {
    const classPatterns = ['translat', 'goog-te-'];

    // 特別處理 body，因為它常被添加 translated-ltr/rtl
    if (document.body && document.body.className) {
      document.body.classList.remove('translated-ltr', 'translated-rtl', 'translated');
    }

    // 處理其他元素
    document.querySelectorAll('*').forEach(element => {
      if (element === document.body || element === document.documentElement) {
        return; // body 已經單獨處理過了
      }

      if (element.className && typeof element.className === 'string') {
        const classes = element.className.split(' ');
        const filteredClasses = classes.filter(cls =>
          !classPatterns.some(pattern => cls.includes(pattern))
        );

        if (filteredClasses.length !== classes.length) {
          element.className = filteredClasses.join(' ');
        }
      }
    });
  }

  /**
   * 還原特定元素
   * @param {Element} element
   */
  revertElement(element) {
    const backup = this.contentBackup.getBackup(element);
    if (!backup) return false;

    try {
      element.innerHTML = backup.innerHTML;

      if (backup.lang) {
        element.setAttribute('lang', backup.lang);
      }

      // 還原其他屬性
      Object.keys(backup.attributes).forEach(attr => {
        if (attr !== 'lang') {
          element.setAttribute(attr, backup.attributes[attr]);
        }
      });

      return true;
    } catch (error) {
      console.error('Anti-Translate: Error reverting element:', error);
      return false;
    }
  }

  /**
   * 強制重新載入頁面（最激進的方式）
   */
  forceReload() {
    // 這會導致頁面完全重新載入，會失去所有狀態
    // 只在其他方法都失效時使用
    if (confirm('是否要重新載入頁面以還原翻譯？這將會失去未儲存的資料。')) {
      window.location.reload();
    }
  }

  /**
   * 部分還原 - 只還原特定區域
   * @param {Element} root
   */
  revertPartial(root = document.body) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let element;
    while ((element = walker.nextNode())) {
      if (this.contentBackup.isModified(element)) {
        this.revertElement(element);
      }
    }
  }

  /**
   * 智能還原 - 嘗試識別並只還原被翻譯的部分
   */
  smartRevert() {
    console.log('Anti-Translate: Starting smart revert');

    // 完全暫停監控，避免無限循環
    const wasWatching = this.detector && this.detector.observer;
    const wasCheckingPeriodically = this.detector && this.detector.intervalId;

    if (this.detector) {
      // 停止 MutationObserver
      if (this.detector.observer) {
        this.detector.observer.disconnect();
      }
      // 停止定期檢查
      if (this.detector.intervalId) {
        clearInterval(this.detector.intervalId);
        this.detector.intervalId = null;
      }
    }

    try {
      // 先移除明顯的翻譯標記
      this.removeTranslationElements();
      this.removeTranslationClasses();
      this.restoreAttributes();

    // 然後檢查是否還有需要還原的內容
    let modifiedCount = 0;
    this.contentBackup.elementSnapshots.forEach((snapshot, element) => {
      if (this.contentBackup.isModified(element)) {
        modifiedCount++;
      }
    });

      // 如果還有很多被修改的元素，可能需要更激進的還原
      if (modifiedCount > 10) {
        console.log(`Anti-Translate: ${modifiedCount} elements still modified, performing deep revert`);
        this.revertPartial();
      }

      console.log('Anti-Translate: Smart revert completed');
    } finally {
      // 延遲恢復監控，給 DOM 時間穩定
      if (this.detector) {
        setTimeout(() => {
          if (wasWatching) {
            this.detector.setupMutationObserver();
          }
          if (wasCheckingPeriodically) {
            this.detector.startPeriodicCheck();
          }
        }, 500);
      }
    }
  }
}

export default TranslationReverter;
