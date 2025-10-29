// Custom Modal Component
// Replaces native alert, confirm, and prompt with styled modals

(function() {
  'use strict';

  // Inject modal HTML and CSS into the page
  function injectModalHTML() {
    const modalHTML = `
      <div id="customModal" class="custom-modal">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Title</h3>
          </div>
          <div class="modal-body">
            <p class="modal-message">Message</p>
            <div class="modal-input-container" style="display: none;">
              <input type="text" id="modalInput" class="modal-input" placeholder="">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary modal-cancel">Cancel</button>
            <button class="btn btn-primary modal-confirm">Confirm</button>
          </div>
        </div>
      </div>
    `;

    const modalStyles = `
      <style>
        .custom-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10000;
          display: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .custom-modal.show {
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 1;
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(2px);
        }

        .modal-content {
          position: relative;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          z-index: 10001;
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
        }

        .modal-title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          color: #333;
        }

        .modal-body {
          padding: 1.5rem;
        }

        .modal-message {
          margin: 0 0 1rem 0;
          color: #666;
          line-height: 1.5;
        }

        .modal-input-container {
          margin-top: 1rem;
        }

        .modal-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.3s ease;
        }

        .modal-input:focus {
          outline: none;
          border-color: #667eea;
        }

        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

        .modal-footer .btn {
          min-width: 100px;
          padding: 0.75rem 1.5rem;
        }

        .btn-secondary {
          background: transparent;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .btn-secondary:hover {
          background: #667eea;
          color: white;
        }

        .btn-primary {
          background: #667eea;
          color: white;
          border: none;
        }

        .btn-primary:hover {
          background: #5a6fd8;
        }

        .btn-danger {
          background: #e74c3c;
          color: white;
          border: none;
        }

        .btn-danger:hover {
          background: #c0392b;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            max-height: 85vh;
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: 1rem;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-footer .btn {
            width: 100%;
          }
        }
      </style>
    `;

    // Inject styles first
    if (!document.getElementById('modalStyles')) {
      const styleElement = document.createElement('div');
      styleElement.id = 'modalStyles';
      styleElement.innerHTML = modalStyles;
      document.head.appendChild(styleElement);
    }

    // Inject modal HTML
    if (!document.getElementById('customModal')) {
      const modalElement = document.createElement('div');
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement.firstElementChild);

      // Attach event listeners
      const modal = document.getElementById('customModal');
      const cancelBtn = modal.querySelector('.modal-cancel');
      const confirmBtn = modal.querySelector('.modal-confirm');
      const backdrop = modal.querySelector('.modal-backdrop');

      // Close on backdrop click
      backdrop.addEventListener('click', hideModal);

      // Close on cancel button
      cancelBtn.addEventListener('click', hideModal);

      // Keyboard support
      document.addEventListener('keydown', function(e) {
        if (modal.classList.contains('show')) {
          if (e.key === 'Escape') {
            hideModal();
          } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            confirmBtn.click();
          }
        }
      });
    }
  }

  // Initialize modal on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectModalHTML);
  } else {
    injectModalHTML();
  }

  // Show confirmation modal
  window.showConfirmModal = function(options) {
    return new Promise((resolve, reject) => {
      const modal = document.getElementById('customModal');
      if (!modal) {
        injectModalHTML();
        setTimeout(() => showConfirmModal(options).then(resolve).catch(reject), 100);
        return;
      }

      const modalTitle = modal.querySelector('.modal-title');
      const modalMessage = modal.querySelector('.modal-message');
      const modalInput = modal.querySelector('.modal-input-container');
      const cancelBtn = modal.querySelector('.modal-cancel');
      const confirmBtn = modal.querySelector('.modal-confirm');

      // Set content
      modalTitle.textContent = options.title || 'Confirm Action';
      modalMessage.textContent = options.message || 'Are you sure?';
      cancelBtn.textContent = options.cancelText || 'Cancel';
      confirmBtn.textContent = options.confirmText || 'Confirm';

      // Hide input for confirmation modal
      modalInput.style.display = 'none';

      // Set button style (danger for destructive actions)
      const confirmClass = options.danger ? 'btn-danger' : 'btn-primary';
      confirmBtn.className = `btn ${confirmClass} modal-confirm`;

      // Hide cancel button if cancelText is null
      if (options.cancelText === null) {
        cancelBtn.style.display = 'none';
      } else {
        cancelBtn.style.display = 'block';
      }

      // Handle confirm
      function onConfirm() {
        hideModal();
        if (options.onConfirm) {
          options.onConfirm();
        }
        resolve(true);
      }

      // Handle cancel
      function onCancel() {
        hideModal();
        if (options.onCancel) {
          options.onCancel();
        }
        reject(false);
      }

      // Remove old listeners
      const newConfirmBtn = confirmBtn.cloneNode(true);
      const newCancelBtn = cancelBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

      // Add new listeners
      newConfirmBtn.addEventListener('click', onConfirm);
      newCancelBtn.addEventListener('click', onCancel);

      // Show modal
      modal.classList.add('show');

      // Focus on confirm button for keyboard navigation
      setTimeout(() => newConfirmBtn.focus(), 100);
    });
  };

  // Show prompt modal (for password input)
  window.showPromptModal = function(options) {
    return new Promise((resolve, reject) => {
      const modal = document.getElementById('customModal');
      if (!modal) {
        injectModalHTML();
        setTimeout(() => showPromptModal(options).then(resolve).catch(reject), 100);
        return;
      }

      const modalTitle = modal.querySelector('.modal-title');
      const modalMessage = modal.querySelector('.modal-message');
      const modalInputContainer = modal.querySelector('.modal-input-container');
      const modalInput = modal.querySelector('#modalInput');
      const cancelBtn = modal.querySelector('.modal-cancel');
      const confirmBtn = modal.querySelector('.modal-confirm');

      // Set content
      modalTitle.textContent = options.title || 'Enter Information';
      modalMessage.textContent = options.message || '';
      modalInput.type = options.inputType || 'text';
      modalInput.placeholder = options.placeholder || '';
      modalInput.value = '';
      cancelBtn.textContent = options.cancelText || 'Cancel';
      confirmBtn.textContent = options.confirmText || 'Confirm';

      // Show input
      modalInputContainer.style.display = 'block';

      // Set button style
      const confirmClass = options.danger ? 'btn-danger' : 'btn-primary';
      confirmBtn.className = `btn ${confirmClass} modal-confirm`;

      // Hide cancel button if cancelText is null
      if (options.cancelText === null) {
        cancelBtn.style.display = 'none';
      } else {
        cancelBtn.style.display = 'block';
      }

      // Handle confirm
      function onConfirm() {
        const value = modalInput.value.trim();
        if (options.required && !value) {
          modalInput.focus();
          return;
        }
        hideModal();
        if (options.onConfirm) {
          options.onConfirm(value);
        }
        resolve(value);
      }

      // Handle cancel
      function onCancel() {
        hideModal();
        if (options.onCancel) {
          options.onCancel();
        }
        reject(null);
      }

      // Remove old listeners
      const newConfirmBtn = confirmBtn.cloneNode(true);
      const newCancelBtn = cancelBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

      // Add new listeners
      newConfirmBtn.addEventListener('click', onConfirm);
      newCancelBtn.addEventListener('click', onCancel);

      // Handle Enter key in input
      modalInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          onConfirm();
        }
      });

      // Show modal
      modal.classList.add('show');

      // Focus on input
      setTimeout(() => modalInput.focus(), 100);
    });
  };

  // Hide modal
  window.hideModal = function() {
    const modal = document.getElementById('customModal');
    if (modal) {
      modal.classList.remove('show');
    }
  };

})();
