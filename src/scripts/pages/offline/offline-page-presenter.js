// src/scripts/pages/offline/offline-page-presenter.js
import { showSuccessMessage, showErrorMessage } from '../../utils/ui-utils';

export default class OfflinePagePresenter {
  #model = null;
  #view = null;
  #boundHandleDeleteClick = null;
  #boundCleanup = null;

  constructor(model, view) {
    this.#model = model;
    this.#view = view;
    this.#boundHandleDeleteClick = this.#handleDeleteClick.bind(this);
    this.#boundCleanup = this._cleanup.bind(this);
  }

  async initialize(container) {
    this.#view.initializeView(container);
    this.#view.registerCallback('delete', this.#boundHandleDeleteClick);
    this.#view.setLoadingState(true);
    
    try {
      await this.#model.loadStories();
      this.#view.renderStories(this.#model.getStories());
    } catch (error) {
      showErrorMessage("Gagal memuat cerita tersimpan.");
      this.#view.showErrorMessage();
    } finally {
      this.#view.setLoadingState(false);
      this.#attachCleanupListener();
    }
  }

  async #handleDeleteClick(event) {
    const button = event.currentTarget;
    const storyId = button.dataset.id;
    if (!storyId) return;

    const storyToDelete = this.#model.findStory(storyId);
    const storyName = storyToDelete ? storyToDelete.name : storyId;

    if (confirm(`Anda yakin ingin menghapus cerita "${storyName}" dari penyimpanan offline?`)) {
      this.#view.showDeleteLoading(button);
      try {
        await this.#model.deleteStory(storyId);
        showSuccessMessage("Cerita berhasil dihapus dari offline.");
        this.#view.removeStoryElement(storyId);
        
        if (this.#model.isEmpty()) {
          this.#view.renderStories([]);
        }
      } catch (error) {
        showErrorMessage(`Gagal menghapus cerita: ${error.message}`);
        this.#view.resetDeleteButton(button);
      }
    }
  }

  _cleanup() {
    console.log("OfflinePage cleanup initiated...");
    this.#view.cleanup();
    window.removeEventListener('hashchange', this.#boundCleanup);
    console.log("OfflinePage cleanup done.");
  }

  #attachCleanupListener() {
    window.removeEventListener('hashchange', this.#boundCleanup);
    window.addEventListener('hashchange', this.#boundCleanup, { once: true });
    console.log("OfflinePage cleanup listener attached.");
  }
}