// src\scripts\pages\home\home-page.js
import HomeModel from './home-model.js';
import HomeView from './home-view.js';
import HomePresenter from './home-presenter.js';

export default class HomePage {
  #model = null;
  #view = null;
  #presenter = null;

  constructor() {
    this.title = 'Beranda - Dicoding Story App';
    console.log("HomePage constructor");
  }


async render() {
  console.log("HomePage rendering...");
  return `
    <section class="container home-page" aria-labelledby="page-heading">
      <h1 id="page-heading" tabindex="0">Cerita Terbaru</h1>
      
      <!-- Notification Toggle Section -->
      <div id="notification-toggle" class="notification-toggle" style="margin-bottom: 20px; padding: 15px; background-color: white; border-radius: 5px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 5px 0; color: black;">Notifikasi Cerita</h3>
            <p style="margin: 0; color: #666;">Dapatkan notifikasi saat cerita baru dipublikasikan</p>
          </div>
          <button id="notification-toggle-btn" class="button button--primary">
            Aktifkan Notifikasi
          </button>
        </div>
      </div>
      
      <div class="stories-container">
          <div id="stories-list" class="stories-list" aria-live="polite" aria-busy="true">
          </div>
          <div id="load-more-container" class="load-more-container" style="display: none;">
              <button id="load-more-button" class="button button--primary">Muat Lebih Banyak</button>
          </div>
          <aside class="map-container" id="map-container-element" aria-labelledby="map-heading">
              <h2 id="map-heading">Peta Lokasi Cerita</h2>
              <div id="story-map" role="application" aria-label="Peta lokasi cerita">
               <div class="content-loading-indicator" role="status">
                   <p>Memuat peta...</p>
               </div>
              </div>
              <p id="map-feedback" style="margin-top: 10px;"><small>Peta akan dimuat...</small></p>
          </aside>
      </div>
    </section>
  `;
}

  async afterRender() {
    console.log("HomePage afterRender started");
    
    // Initialize MVP components
    this.#model = new HomeModel();
    this.#view = new HomeView();
    this.#presenter = new HomePresenter({
      model: this.#model,
      view: this.#view
    });
    
    // Initialize application
    await this.#presenter.init();
    console.log("HomePage afterRender finished");
  }

  // Clean up when page is unloaded
  async _cleanup() {
    if (this.#presenter) {
      await this.#presenter.cleanup();
    }
    
    this.#model = null;
    this.#view = null;
    this.#presenter = null;
    
    console.log("[Home Page] Cleanup complete from main page");
  }
}