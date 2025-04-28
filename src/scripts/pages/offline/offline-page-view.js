// src/scripts/pages/offline/offline-page-view.js
import { setContentBusy } from '../../utils/ui-utils';

export default class OfflinePageView {
  #container = null;
  #callback = {};

  initializeView(container) {
    this.#container = container;
  }

  registerCallback(type, callback) {
    this.#callback[type] = callback;
  }

  getTemplate() {
    return `
      <section class="container offline-page" id="offline-page-container" aria-labelledby="page-heading">
        <h1 id="page-heading">Cerita Tersimpan Offline</h1>
         <div id="offline-stories-list" class="stories-list" aria-live="polite" aria-busy="true">
            <div class="content-loading-indicator" role="status">
                <div class="spinner" aria-hidden="true"></div>
                <p>Memuat cerita tersimpan...</p>
            </div>
         </div>
      </section>
    `;
  }

  setLoadingState(isLoading) {
    if (!this.#container) return;
    
    setContentBusy(this.#container, isLoading, 'Memuat cerita tersimpan...');
    if (!isLoading) {
      this.#container.removeAttribute('aria-busy');
    }
  }

  showErrorMessage() {
    if (!this.#container) return;
    this.#container.innerHTML = '<p class="error-message" style="text-align:center; padding: 20px;">Gagal memuat data offline.</p>';
  }

  renderStories(stories) {
    if (!this.#container) return;
    this.#container.innerHTML = '';

    if (stories.length === 0) {
      this.#container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--medium-text);">Belum ada cerita yang disimpan untuk akses offline.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    stories.forEach(story => {
      const storyItemContainer = document.createElement('div');
      storyItemContainer.className = 'offline-story-item-wrapper';

      const storyItemElement = document.createElement('story-item');
      storyItemElement.story = story;
      storyItemContainer.appendChild(storyItemElement);

      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Hapus';
      deleteButton.className = 'button button--danger button--sm offline-delete-button';
      deleteButton.setAttribute('aria-label', `Hapus cerita offline oleh ${story.name}`);
      deleteButton.dataset.id = story.id;
      deleteButton.addEventListener('click', (event) => {
        if (this.#callback.delete) {
          this.#callback.delete(event);
        }
      });
      storyItemContainer.appendChild(deleteButton);

      fragment.appendChild(storyItemContainer);
    });

    this.#container.appendChild(fragment);
    this.#addWrapperStyles();
  }

  showDeleteLoading(button) {
    button.disabled = true;
    button.innerHTML = '<span class="spinner spinner--small"></span> Menghapus...';
  }

  resetDeleteButton(button) {
    button.disabled = false;
    button.innerHTML = '<i class="fas fa-trash-alt"></i> Hapus';
  }

  removeStoryElement(storyId) {
    const wrapper = this.#container.querySelector(`.offline-delete-button[data-id="${storyId}"]`)?.closest('.offline-story-item-wrapper');
    if (wrapper) {
      wrapper.remove();
    }
  }

  #addWrapperStyles() {
    if (!document.getElementById('offline-item-style')) {
      const style = document.createElement('style');
      style.id = 'offline-item-style';
      style.innerHTML = `
          .offline-story-item-wrapper {
              display: flex;
              flex-direction: column;
              gap: 0;
              break-inside: avoid-column;
              page-break-inside: avoid;
              -webkit-column-break-inside: avoid;
              margin-bottom: var(--spacing-lg);
              position: relative;
          }
          .offline-story-item-wrapper story-item {
             margin-bottom: 0 !important;
             border-bottom-left-radius: 0;
             border-bottom-right-radius: 0;
             border-bottom: none;
          }
          .offline-delete-button {
              border-top-left-radius: 0;
              border-top-right-radius: 0;
              width: 100%;
              padding: var(--spacing-sm) var(--spacing-md);
              font-size: 0.85rem;
              border-top: 1px solid #6e3b3b;
          }
          .offline-delete-button .spinner {
             border-left-color: white;
          }
      `;
      document.head.appendChild(style);
    }
  }

  cleanup() {
    const buttons = this.#container?.querySelectorAll('.offline-delete-button');
    buttons?.forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
    });
    this.#container = null;
  }
}