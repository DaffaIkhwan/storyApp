export function setLoadingState(loadingElement, submitButton, isLoading, otherControls = []) {
    if (!loadingElement || !submitButton) {
        console.warn("setLoadingState: Loading or Submit element not provided.");
        return;
    }

    loadingElement.style.display = isLoading ? 'inline-flex' : 'none';
    submitButton.disabled = isLoading;

    if(isLoading) {
      submitButton.setAttribute('aria-busy', 'true');
      if (!submitButton.dataset.originalText) {
          submitButton.dataset.originalText = submitButton.innerHTML;
      }
    } else {
      submitButton.removeAttribute('aria-busy');
    }

    otherControls.forEach(control => {
        if (control && typeof control.disabled !== 'undefined') {
            control.disabled = isLoading;
        }
    });
  }

  export function showElementError(errorElement, message, elementToFocus = null) {
    if (!errorElement) {
       console.warn("showElementError: Error element not provided for message:", message);
       console.error("Error:", message);
       showNotification(message, 'error');
       return;
    }
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.setAttribute('tabindex', '-1');
    if (!errorElement.getAttribute('role')) {
     errorElement.setAttribute('role', 'alert');
    }

    if (elementToFocus && typeof elementToFocus.focus === 'function' && elementToFocus.offsetParent !== null) {
        elementToFocus.focus();
        if (elementToFocus.tagName === 'INPUT' || elementToFocus.tagName === 'TEXTAREA' || elementToFocus.tagName === 'SELECT') {
         elementToFocus.setAttribute('aria-invalid', 'true');
         if (errorElement.id) {
           const existingDesc = elementToFocus.getAttribute('aria-describedby');
           const newDescValue = existingDesc ? `${existingDesc} ${errorElement.id}` : errorElement.id;
           const uniqueIds = [...new Set(newDescValue.split(' '))].join(' ');
           elementToFocus.setAttribute('aria-describedby', uniqueIds);
         }
       }
    } else {
        errorElement.focus();
    }
  }

  export function clearElementError(errorElement, relatedInput = null) {
    if (!errorElement) return;
    errorElement.textContent = '';
    errorElement.style.display = 'none';
    errorElement.removeAttribute('role');
    errorElement.removeAttribute('tabindex');

    if (relatedInput) {
        relatedInput.removeAttribute('aria-invalid');
        if (errorElement.id) {
         const desc = relatedInput.getAttribute('aria-describedby');
         if (desc) {
           const newDesc = desc.split(' ').filter(id => id !== errorElement.id).join(' ');
           if (newDesc) {
               relatedInput.setAttribute('aria-describedby', newDesc);
           } else {
               relatedInput.removeAttribute('aria-describedby');
           }
         }
        }
    }
  }

  export function showNotification(message, type = 'info', duration = 3000) {
      const container = document.getElementById('notification-container');
      if (!container) {
          console.warn("Notification container '#notification-container' not found. Falling back to alert.");
          alert(`${type.toUpperCase()}: ${message}`);
          return;
      }

      const notification = document.createElement('div');
      notification.className = `toast-notification toast--${type}`;
      notification.setAttribute('role', 'status');
      notification.setAttribute('aria-live', 'polite');

      let iconClass = 'fas fa-info-circle';
      if (type === 'success') iconClass = 'fas fa-check-circle';
      else if (type === 'error') iconClass = 'fas fa-exclamation-circle';

      notification.innerHTML = `
          <i class="${iconClass}" aria-hidden="true"></i>
          <span>${message}</span>
          <button class="close-button" aria-label="Tutup notifikasi">&times;</button>
      `;

      container.appendChild(notification);

      const removeNotification = () => {
          notification.classList.remove('show');
          notification.addEventListener('transitionend', () => {
              try {
                  container.removeChild(notification);
              } catch (e) {}
          }, { once: true });
      };

      requestAnimationFrame(() => {
          setTimeout(() => {
            notification.classList.add('show');
          }, 10);
      });


      const timerId = setTimeout(removeNotification, duration);

      notification.querySelector('.close-button').addEventListener('click', () => {
          clearTimeout(timerId);
          removeNotification();
      });
  }


  export function showSuccessMessage(message, duration = 3000) {
      showNotification(message, 'success', duration);
  }

  export function showErrorMessage(message, duration = 5000) {
      showNotification(message, 'error', duration);
  }


  export function setContentBusy(containerElement, isBusy, loadingMessage = 'Memuat data...') {
      if (!containerElement) return;

      const indicatorClass = 'content-loading-indicator';
      let loadingEl = containerElement.querySelector(`.${indicatorClass}`);

      if (isBusy) {
          containerElement.setAttribute('aria-busy', 'true');
          containerElement.setAttribute('aria-label', loadingMessage);

          if (!loadingEl) {
             loadingEl = document.createElement('div');
             loadingEl.className = indicatorClass;
             loadingEl.setAttribute('role', 'status');
             loadingEl.setAttribute('aria-live', 'polite');
             loadingEl.innerHTML = `
                 <div class="spinner" aria-hidden="true"></div>
                 <p>${loadingMessage}</p>
             `;
             containerElement.innerHTML = '';
             containerElement.appendChild(loadingEl);
          }
           loadingEl.style.display = 'flex';
      } else {
          containerElement.removeAttribute('aria-busy');
          containerElement.removeAttribute('aria-label');
          if (loadingEl) {
              try { containerElement.removeChild(loadingEl); } catch(e) {}
          }
      }
  }

let modalElement = null;
let modalImageElement = null;
let modalCaptionElement = null;
let modalCloseButton = null;
let previouslyFocusedElement = null;

function cacheModalElements() {
    modalElement = document.getElementById('image-modal');
    if (modalElement) {
        modalImageElement = modalElement.querySelector('.image-modal__image');
        modalCaptionElement = modalElement.querySelector('.image-modal__caption');
        modalCloseButton = modalElement.querySelector('.image-modal__close');
    }
}

export function initImageModal() {
    cacheModalElements();
    if (!modalElement || !modalCloseButton) {
        console.warn('Image modal elements not found for initialization.');
        return;
    }

    modalCloseButton.addEventListener('click', closeImageModal);
    modalElement.addEventListener('click', (event) => {
        if (event.target === modalElement) {
            closeImageModal();
        }
    });
    modalElement.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeImageModal();
        }
    });
}


export function openImageModal(imageUrl, caption = '') {
    if (!modalElement || !modalImageElement || !modalCaptionElement) {
        cacheModalElements();
        if (!modalElement || !modalImageElement || !modalCaptionElement) {
            console.error('Cannot open modal: elements not found or cached.');
            return;
        }
    }

    previouslyFocusedElement = document.activeElement;

    modalImageElement.src = imageUrl || '';
    modalImageElement.alt = caption || 'Gambar cerita';
    modalCaptionElement.textContent = caption || '';

    modalElement.setAttribute('aria-hidden', 'false');

    if(modalCloseButton) {
        modalCloseButton.focus();
    } else {
        modalElement.focus();
    }
}

export function closeImageModal() {
    if (!modalElement) return;

    modalElement.setAttribute('aria-hidden', 'true');

    if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === 'function') {
        previouslyFocusedElement.focus();
    }
    previouslyFocusedElement = null;
}