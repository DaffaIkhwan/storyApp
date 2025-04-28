// src/scripts/pages/stories/detail-story-presenter.js
import { initMap, addMarker, getMapInstance, openImageModal } from '../../utils/index.js';
import { showSuccessMessage, showErrorMessage } from '../../utils/ui-utils.js';

export default class DetailStoryPresenter {
    constructor(view, model) {
        this._view = view;
        this._model = model;
        this._boundHandleImageClick = this._handleImageClick.bind(this);
        this._boundHandleSaveOfflineClick = this._handleSaveOfflineClick.bind(this);
        this._boundCleanup = this._cleanup.bind(this);
    }

    async init(storyId) {
        if (!storyId) {
            this._view.hideLoading();
            this._view.showError('Tidak dapat memuat cerita: ID tidak ditemukan di URL.', 'Error - ID Tidak Ditemukan');
            return;
        }

        this._view.showLoading();

        try {
            // Fetch story data
            const story = await this._model.fetchStory(storyId);
            
            // Update page title and render content
            const isOffline = this._model.isOfflineSaved();
            this._view.updatePageTitle(story.name, isOffline);
            
            if (isOffline) {
                this._view.showOfflineNotification();
            } else {
                // Check offline status if it's not already determined by failed fetch
                await this._model.checkOfflineStatus(story.id);
            }
            
            this._view.renderStoryDetails(story, this._model.isOfflineSaved());
            this._view.hideLoading();
            
            // Setup event listeners
            this._view.setupImageClickListener(this._boundHandleImageClick);
            this._view.setupSaveOfflineButton(this._boundHandleSaveOfflineClick);
            
            // Initialize map if coordinates exist
            if (story.lat && typeof story.lat === 'number' && 
                story.lon && typeof story.lon === 'number') {
                this._initStoryMap();
            }
            
            this._attachCleanupListener();
            
        } catch (error) {
            this._view.hideLoading();
            this._view.showError(`Gagal memuat cerita: ${error.message}. Versi offline juga tidak ditemukan.`);
        }
    }

    _handleImageClick(event) {
        event.stopPropagation();
        const story = this._model.getStory();
        if (story) {
            // Get image URL - either from blob URL or photo URL
            const view = this._view;
            const imageUrl = view._blobUrl || story.photoUrl;
            if (imageUrl) {
                openImageModal(imageUrl, `Cerita oleh ${story.name || 'Anonim'}`);
            }
        }
    }

    async _handleSaveOfflineClick() {
        const story = this._model.getStory();
        if (!story || !story.id) return;

        this._view.setSaveButtonLoading();

        try {
            if (this._model.isOfflineSaved()) {
                await this._model.deleteStoryOffline();
                showSuccessMessage(`Cerita "${story.name}" dihapus dari penyimpanan offline.`);
            } else {
                await this._model.saveStoryOffline();
                showSuccessMessage(`Cerita "${story.name}" disimpan untuk akses offline.`);
            }
            this._view.updateSaveButtonState(this._model.isOfflineSaved());
        } catch (error) {
            const action = this._model.isOfflineSaved() ? 'menghapus' : 'menyimpan';
            showErrorMessage(`Gagal ${action} cerita: ${error.message}`);
        } finally {
            this._view.enableSaveButton();
            this._view.updateSaveButtonState(this._model.isOfflineSaved());
        }
    }

    _initStoryMap() {
        const story = this._model.getStory();
        if (!story || typeof story.lat !== 'number' || typeof story.lon !== 'number') return;

        const mapElement = this._view.getMapContainer();
        if (!mapElement) return;

        this._view.setupMapLoadingIndicator();

        try {
            const coords = [story.lat, story.lon];
            
            // Remove existing map if any
            if (mapElement._leaflet_id) {
                const oldMap = getMapInstance();
                if (oldMap && oldMap.getContainer().id === 'detail-story-map') {
                    oldMap.remove();
                }
            }

            // Initialize new map
            const map = initMap('detail-story-map', coords, 15);
            this._view.setMapInstance(map);
            
            if (map) {
                const popupContent = `Lokasi cerita oleh ${story.name || 'Anonim'}`;
                addMarker(coords, popupContent, { draggable: false });
                map.eachLayer(layer => {
                    if (layer instanceof L.Marker) {
                        layer.openPopup();
                    }
                });
            } else {
                this._view.showMapError();
            }
        } catch (mapError) {
            this._view.showMapError();
        }
    }

    _attachCleanupListener() {
        window.removeEventListener('hashchange', this._boundCleanup);
        window.addEventListener('hashchange', this._boundCleanup, { once: true });
    }

    _cleanup() {
        this._view.removeImageClickListener(this._boundHandleImageClick);
        this._view.removeSaveOfflineButtonListener(this._boundHandleSaveOfflineClick);
        
        // Clean up map
        const map = this._view.getMapInstance();
        if (map && typeof map.remove === 'function') {
            try { map.remove(); } catch (e) {}
        } else {
            const globalMap = getMapInstance();
            if (globalMap && globalMap.getContainer() && globalMap.getContainer().id === 'detail-story-map') {
                try { globalMap.remove(); } catch (e) {}
            }
        }
        
        window.removeEventListener('hashchange', this._boundCleanup);
        this._view.cleanup();
    }
}