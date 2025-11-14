/**
 * WarningModal - 顯示翻譯警告彈窗
 */
class WarningModal {
  constructor(options = {}) {
    this.options = {
      message: options.message || '偵測到網頁已被翻譯，請留意內容的正確性。',
      showRevertButton: options.showRevertButton !== false,
      revertButtonText: options.revertButtonText || '還原網頁',
      closeButtonText: options.closeButtonText || '關閉',
      zIndex: options.zIndex || 999999,
      ...options
    };

    this.modal = null;
    this.isVisible = false;
    this.onRevertCallback = null;
  }

  /**
   * 顯示警告彈窗
   */
  show() {
    if (this.isVisible) return;

    this.createModal();
    document.body.appendChild(this.modal);
    this.isVisible = true;

    // 添加淡入動畫
    requestAnimationFrame(() => {
      this.modal.style.opacity = '1';
    });
  }

  /**
   * 隱藏警告彈窗
   */
  hide() {
    if (!this.isVisible || !this.modal) return;

    this.modal.style.opacity = '0';
    setTimeout(() => {
      if (this.modal && this.modal.parentNode) {
        this.modal.parentNode.removeChild(this.modal);
      }
      this.modal = null;
      this.isVisible = false;
    }, 300);
  }

  /**
   * 建立彈窗 DOM 結構
   */
  createModal() {
    const modal = document.createElement('div');
    modal.className = 'anti-translate-modal-overlay';
    modal.innerHTML = `
      <div class="anti-translate-modal">
        <div class="anti-translate-modal-header">
          <h3>⚠️ 翻譯偵測</h3>
        </div>
        <div class="anti-translate-modal-body">
          <p>${this.options.message}</p>
        </div>
        <div class="anti-translate-modal-footer">
          ${this.options.showRevertButton ?
            `<button class="anti-translate-btn anti-translate-btn-primary" data-action="revert">
              ${this.options.revertButtonText}
            </button>` : ''}
          <button class="anti-translate-btn anti-translate-btn-secondary" data-action="close">
            ${this.options.closeButtonText}
          </button>
        </div>
      </div>
    `;

    this.injectStyles();
    this.attachEventListeners(modal);
    this.modal = modal;
  }

  /**
   * 注入樣式
   */
  injectStyles() {
    if (document.getElementById('anti-translate-styles')) return;

    const style = document.createElement('style');
    style.id = 'anti-translate-styles';
    style.textContent = `
      .anti-translate-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${this.options.zIndex};
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      .anti-translate-modal {
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        max-width: 500px;
        width: 90%;
        overflow: hidden;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateY(-50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .anti-translate-modal-header {
        padding: 20px;
        border-bottom: 1px solid #e0e0e0;
        background-color: #f8f9fa;
      }

      .anti-translate-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }

      .anti-translate-modal-body {
        padding: 20px;
      }

      .anti-translate-modal-body p {
        margin: 0;
        font-size: 14px;
        line-height: 1.6;
        color: #666;
      }

      .anti-translate-modal-footer {
        padding: 15px 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .anti-translate-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .anti-translate-btn-primary {
        background-color: #007bff;
        color: white;
      }

      .anti-translate-btn-primary:hover {
        background-color: #0056b3;
      }

      .anti-translate-btn-secondary {
        background-color: #6c757d;
        color: white;
      }

      .anti-translate-btn-secondary:hover {
        background-color: #5a6268;
      }

      .anti-translate-btn:active {
        transform: scale(0.98);
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 附加事件監聽器
   * @param {HTMLElement} modal
   */
  attachEventListeners(modal) {
    // 直接在按鈕上綁定事件
    const revertBtn = modal.querySelector('[data-action="revert"]');
    const closeBtn = modal.querySelector('[data-action="close"]');

    if (revertBtn) {
      revertBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.onRevertCallback) {
          this.onRevertCallback();
        }
        this.hide();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.hide();
      });
    }

    // 點擊遮罩層關閉
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('anti-translate-modal-overlay')) {
        this.hide();
      }
    });

    // 阻止彈窗內部點擊事件冒泡（但按鈕事件已經單獨處理過了）
    const modalContent = modal.querySelector('.anti-translate-modal');
    if (modalContent) {
      modalContent.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }
  }

  /**
   * 設置還原按鈕的回調函數
   * @param {Function} callback
   */
  onRevert(callback) {
    this.onRevertCallback = callback;
  }

  /**
   * 檢查彈窗是否顯示
   * @returns {boolean}
   */
  isShown() {
    return this.isVisible;
  }

  /**
   * 更新警告訊息
   * @param {string} message
   */
  updateMessage(message) {
    if (this.modal) {
      const body = this.modal.querySelector('.anti-translate-modal-body p');
      if (body) {
        body.textContent = message;
      }
    }
    this.options.message = message;
  }
}

export default WarningModal;
