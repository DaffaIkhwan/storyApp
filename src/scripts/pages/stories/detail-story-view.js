// src/scripts/pages/stories/detail-story-view.js
import { showFormattedDate, openImageModal } from '../../utils/index.js';
import { setContentBusy, showElementError, showSuccessMessage, showErrorMessage, showNotification } from '../../utils/ui-utils.js';

export default class DetailStoryView {
    constructor() {
        this._pageContainer = null;
        this._imageElement = null;
        this._saveOfflineButton = null;
        this._map = null;
        this._blobUrl = null;
    }

    getTemplate() {
        return `
            <section class="container detail-story-page" id="detail-story-container" aria-live="polite" aria-busy="true">
                <div class="content-loading-indicator" role="status">
                    <div class="spinner" aria-hidden="true"></div>
                    <p>Memuat detail cerita...</p>
                </div>
            </section>
        `;
    }

    setUp() {
        this._pageContainer = document.getElementById('detail-story-container');
        return this._pageContainer;
    }

    showLoading(message = 'Memuat detail cerita...') {
        setContentBusy(this._pageContainer, true, message);
    }

    hideLoading() {
        setContentBusy(this._pageContainer, false);
        this._pageContainer?.removeAttribute('aria-busy');
    }

    showError(message, title = 'Error Memuat Cerita') {
        document.title = title;
        showElementError(this._pageContainer, message, null);
        this._pageContainer?.removeAttribute('aria-busy');
        const errorElement = this._pageContainer?.querySelector('.error-message');
        if (errorElement) errorElement.focus();
    }
    
    showOfflineNotification() {
        showNotification("Menampilkan versi offline karena gagal mengambil data terbaru.", "info", 5000);
    }

    renderStoryDetails(story, isSavedOffline) {
        if (!story || !this._pageContainer) return;

        const { 
            name = 'Tanpa Nama', 
            description = 'Tidak ada deskripsi.', 
            photoUrl, 
            photoBlob, 
            createdAt, 
            lat, 
            lon 
        } = story;

        const formattedDate = createdAt ? showFormattedDate(createdAt) : 'Tanggal tidak tersedia';
        const fallbackImage = 'images/placeholder.png';
        
        // Gunakan Blob URL jika tersedia
        let imageUrl;
        if (photoBlob) {
            imageUrl = URL.createObjectURL(photoBlob);
            // Simpan URL untuk dibersihkan nanti
            this._blobUrl = imageUrl;
        } else {
            imageUrl = photoUrl || fallbackImage;
        }

        const hasLocation = typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon);

        const saveButtonText = isSavedOffline ? '<i class="fas fa-trash-alt"></i> Hapus dari Offline' : '<i class="fas fa-save"></i> Simpan Offline';
        const saveButtonClass = isSavedOffline ? 'button--danger' : 'button--success';

        this._pageContainer.innerHTML = `
          <h1 id="detail-page-heading" tabindex="-1">Cerita oleh ${name} ${isSavedOffline ? '<span style="font-size: 0.7em; color: var(--medium-text); font-weight: normal;">(Offline)</span>' : ''}</h1>
          <div class="detail-story__layout">
              <div class="detail-story__media" role="button" aria-label="Perbesar gambar cerita">
                   <img src="${imageUrl}" alt="Gambar cerita oleh ${name}" class="detail-story__image" onerror="this.onerror=null; this.src='${fallbackImage}'; this.alt='Gagal memuat gambar cerita oleh ${name}';">
              </div>
              <div class="detail-story__content">
                   <p class="detail-story__date" aria-label="Tanggal dibuat">
                       <i class="far fa-calendar-alt" aria-hidden="true"></i> Dibuat pada: ${formattedDate}
                   </p>
                   <p class="detail-story__description">${description}</p>
                   ${hasLocation ? `
                       <div class="detail-story__location">
                           <h2>Lokasi Cerita</h2>
                           <div id="detail-story-map" class="detail-story__map" role="application" aria-label="Peta lokasi cerita">
                               <div class="content-loading-indicator" role="status"><p>Memuat peta...</p></div>
                           </div>
                       </div>
                   ` : `
                       <p class="detail-story__no-location">
                           <i class="fas fa-map-marker-slash" aria-hidden="true"></i> Lokasi tidak tersedia untuk cerita ini.
                       </p>
                   `}
              </div>
          </div>
          <div class="detail-story__actions">
              <a href="#/" class="button button--secondary"><i class="fas fa-arrow-left" aria-hidden="true"></i> Kembali ke Beranda</a>
              <button id="save-offline-button" class="button ${saveButtonClass}" aria-live="polite">
                  ${saveButtonText}
              </button>
          </div>
        `;

        this._imageElement = this._pageContainer.querySelector('.detail-story__image');
        this._saveOfflineButton = this._pageContainer.querySelector('#save-offline-button');

        const heading = document.getElementById('detail-page-heading');
        if (heading) heading.focus();
    }

    updatePageTitle(name, isOffline = false) {
        const title = isOffline ? 
            `(Offline) Cerita oleh ${name} - Dicoding Story App` : 
            `Cerita oleh ${name} - Dicoding Story App`;
        document.title = title;
        return title;
    }

    setupImageClickListener(handler) {
        const mediaElement = this._imageElement?.closest('.detail-story__media');
        if (mediaElement) {
            mediaElement.addEventListener('click', handler);
            mediaElement.style.cursor = 'zoom-in';
        }
    }

    removeImageClickListener(handler) {
        const mediaElement = this._imageElement?.closest('.detail-story__media');
        if (mediaElement) {
            mediaElement.removeEventListener('click', handler);
            mediaElement.style.cursor = '';
        }
    }

    setupSaveOfflineButton(handler) {
        if (this._saveOfflineButton) {
            this._saveOfflineButton.addEventListener('click', handler);
        }
    }

    removeSaveOfflineButtonListener(handler) {
        if (this._saveOfflineButton) {
            this._saveOfflineButton.removeEventListener('click', handler);
        }
    }

    updateSaveButtonState(isSavedOffline) {
        if (!this._saveOfflineButton) return;
        
        const saveButtonText = isSavedOffline ? 
            '<i class="fas fa-trash-alt"></i> Hapus dari Offline' : 
            '<i class="fas fa-save"></i> Simpan Offline';
            
        const saveButtonClass = isSavedOffline ? 'button--danger' : 'button--success';
        
        this._saveOfflineButton.innerHTML = saveButtonText;
        this._saveOfflineButton.className = `button ${saveButtonClass}`;
    }

    setSaveButtonLoading() {
        if (this._saveOfflineButton) {
            this._saveOfflineButton.disabled = true;
            this._saveOfflineButton.innerHTML = '<span class="spinner spinner--small"></span> Memproses...';
        }
    }

    enableSaveButton() {
        if (this._saveOfflineButton) {
            this._saveOfflineButton.disabled = false;
        }
    }

    getMapContainer() {
        return document.getElementById('detail-story-map');
    }

    setMapInstance(map) {
        this._map = map;
    }

    getMapInstance() {
        return this._map;
    }

    setupMapLoadingIndicator() {
        const mapElement = this.getMapContainer();
        if (!mapElement) return;
        
        const loadingIndicator = mapElement.querySelector('.content-loading-indicator');
        if (loadingIndicator) mapElement.removeChild(loadingIndicator);
    }

    showMapError(message = 'Gagal memuat peta lokasi.') {
        const mapElement = this.getMapContainer();
        if (mapElement) {
            showElementError(mapElement, message);
        }
    }

    cleanup() {
        // Bersihkan Blob URL jika ada
        if (this._blobUrl) {
            URL.revokeObjectURL(this._blobUrl);
            this._blobUrl = null;
        }

        if (this._map && typeof this._map.remove === 'function') {
            try { this._map.remove(); } catch (e) {}
            this._map = null;
        }

        this._pageContainer = null;
        this._imageElement = null;
        this._saveOfflineButton = null;
    }
}