/**
 * ContentBackup - 備份和管理原始網頁內容
 */
class ContentBackup {
  constructor() {
    this.originalContent = new WeakMap();
    this.textNodes = new Map();
    this.elementSnapshots = new Map();
  }

  /**
   * 初始化並備份整個頁面
   */
  init() {
    this.backupElement(document.body);
    this.createTextNodeSnapshot(document.body);
  }

  /**
   * 備份單一元素的原始內容
   * @param {Element} element
   */
  backupElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return;

    const snapshot = {
      innerHTML: element.innerHTML,
      lang: element.getAttribute('lang'),
      attributes: this.getAttributes(element),
      timestamp: Date.now()
    };

    this.elementSnapshots.set(element, snapshot);
    this.originalContent.set(element, element.cloneNode(true));

    // 遞迴備份子元素
    Array.from(element.children).forEach(child => {
      this.backupElement(child);
    });
  }

  /**
   * 建立文字節點的快照
   * @param {Element} root
   */
  createTextNodeSnapshot(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 忽略空白節點
          return node.textContent.trim().length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while ((node = walker.nextNode())) {
      const id = this.generateNodeId();
      this.textNodes.set(id, {
        node: node,
        text: node.textContent,
        parent: node.parentElement,
        checksum: this.calculateChecksum(node.textContent)
      });
    }
  }

  /**
   * 獲取元素的所有屬性
   * @param {Element} element
   * @returns {Object}
   */
  getAttributes(element) {
    const attrs = {};
    Array.from(element.attributes).forEach(attr => {
      attrs[attr.name] = attr.value;
    });
    return attrs;
  }

  /**
   * 計算文字內容的校驗和
   * @param {string} text
   * @returns {number}
   */
  calculateChecksum(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * 生成唯一的節點 ID
   * @returns {string}
   */
  generateNodeId() {
    return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 獲取元素的備份內容
   * @param {Element} element
   * @returns {Object|null}
   */
  getBackup(element) {
    return this.elementSnapshots.get(element) || null;
  }

  /**
   * 檢查內容是否被修改
   * @param {Element} element
   * @returns {boolean}
   */
  isModified(element) {
    const backup = this.getBackup(element);
    if (!backup) return false;

    return backup.innerHTML !== element.innerHTML ||
           backup.lang !== element.getAttribute('lang');
  }

  /**
   * 備份新增的動態元素
   * @param {Element} element
   */
  backupDynamicElement(element) {
    if (this.elementSnapshots.has(element)) return;
    this.backupElement(element);
  }

  /**
   * 清除所有備份
   */
  clear() {
    this.textNodes.clear();
    this.elementSnapshots.clear();
  }
}

export default ContentBackup;
