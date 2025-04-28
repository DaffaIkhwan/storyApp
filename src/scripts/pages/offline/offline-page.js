// src/scripts/pages/offline/offline-page.js
import OfflinePageModel from './offline-page-model';
import OfflinePageView from './offline-page-view';
import OfflinePagePresenter from './offline-page-presenter';

export default class OfflinePage {
  #model = null;
  #view = null;
  #presenter = null;

  constructor() {
    this.title = 'Cerita Tersimpan - Dicoding Story App';
    this.#model = new OfflinePageModel();
    this.#view = new OfflinePageView();
    this.#presenter = new OfflinePagePresenter(this.#model, this.#view);
  }

  async render() {
    return this.#view.getTemplate();
  }

  async afterRender() {
    const container = document.getElementById('offline-stories-list');
    if (!container) return;
    
    await this.#presenter.initialize(container);
  }
}