import { setupMapInput, getMapInstance, clearMarkers, addMarker } from '../../utils/map-utils.js';
import { startCameraStream, stopCameraStream, capturePhoto } from '../../utils/camera-utils.js';
import { setLoadingState, showElementError, clearElementError, showSuccessMessage, showErrorMessage } from '../../utils/ui-utils.js';

export default class AddStoryPageView {
    constructor() {
        this.map = null;
        this.isCameraActive = false;
        this.isSubmitting = false;
        this.domElements = {};
        
        console.log("[AddStoryPageView] Initialized.");
    }

    render() {
        console.log("[AddStoryPageView] Rendering...");
        return `
            <section class="container add-story-page" aria-labelledby="page-heading">
                <h1 id="page-heading">Tambah Cerita Baru</h1>
                <form id="add-story-form" novalidate>
                    <div class="form-group">
                        <label for="story-description">Deskripsi Cerita (Wajib):</label>
                        <textarea id="story-description" name="description" required rows="5" placeholder="Tulis deskripsi ceritamu di sini..." aria-describedby="desc-error" aria-required="true"></textarea>
                         <p id="desc-error" class="error-message" role="alert" style="display: none;"></p>
                    </div>
                    <div class="form-group">
                        <label id="photo-label">Foto Cerita (Wajib, maks 1MB):</label>
                        <div class="camera-controls" role="group" aria-labelledby="photo-label">
                             <button type="button" id="start-camera-button" class="button button--secondary" aria-label="Gunakan kamera"><i class="fas fa-camera" aria-hidden="true"></i> Gunakan Kamera</button>
                             <button type="button" id="capture-photo-button" class="button button--secondary" disabled aria-label="Ambil foto"><i class="fas fa-circle-notch" aria-hidden="true"></i> Ambil Foto</button>
                             <button type="button" id="upload-file-button" class="button button--secondary" aria-label="Unggah foto"><i class="fas fa-upload" aria-hidden="true"></i> Unggah File</button>
                             <input type="file" id="photo-file-input" accept="image/png, image/jpeg" style="display: none;" aria-hidden="true">
                        </div>
                        <div id="camera-container" class="camera-container" style="display: none; margin-top: 15px;"><video id="camera-video" playsinline muted autoplay aria-label="Pratinjau kamera"></video><canvas id="photo-canvas" style="display: none;" aria-hidden="true"></canvas></div>
                        <img id="photo-preview" src="#" alt="Pratinjau foto cerita" style="margin-top: 15px; display: none;" />
                        <p id="photo-error" class="error-message" role="alert" style="display: none; margin-top: 5px;"></p>
                    </div>
                    <div class="form-group">
                        <label id="location-label" for="location-map">Lokasi Cerita (Opsional):</label>
                        <p><small>Klik di peta, geser marker, atau gunakan lokasi saat ini.</small></p>
                        <div class="location-controls">
                            <button type="button" id="get-current-location-button" class="button button--secondary">
                                <i class="fas fa-map-marker-alt" aria-hidden="true"></i> Gunakan Lokasi Saya
                            </button>
                            <span id="location-feedback" class="location-feedback" aria-live="polite"></span>
                        </div>
                        <div id="location-map" style="margin-top: 10px;" role="application" aria-labelledby="location-label"></div>
                        <p id="selected-coords" style="margin-top: 10px;" aria-live="polite"></p>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="button button--primary" id="submit-story-button"><i class="fas fa-share" aria-hidden="true"></i> Bagikan Cerita</button>
                         <div id="loading-indicator" class="loading-indicator" style="display: none;" role="status"><div class="spinner spinner--small"></div> Mengirim...</div>
                    </div>
                    <p id="form-error-message" class="error-message" role="alert" style="display: none;" tabindex="-1"></p>
                </form>
            </section>
        `;
    }

    cacheDOMElements() {
        console.log("[AddStoryPageView] Caching DOM elements...");
        this.domElements = {
            form: document.getElementById('add-story-form'),
            descriptionInput: document.getElementById('story-description'),
            descriptionErrorElement: document.getElementById('desc-error'),
            videoElement: document.getElementById('camera-video'),
            canvasElement: document.getElementById('photo-canvas'),
            photoPreviewElement: document.getElementById('photo-preview'),
            photoFileInput: document.getElementById('photo-file-input'),
            photoErrorElement: document.getElementById('photo-error'),
            cameraContainer: document.getElementById('camera-container'),
            startCameraButton: document.getElementById('start-camera-button'),
            capturePhotoButton: document.getElementById('capture-photo-button'),
            uploadFileButton: document.getElementById('upload-file-button'),
            selectedCoordsElement: document.getElementById('selected-coords'),
            submitButton: document.getElementById('submit-story-button'),
            loadingIndicator: document.getElementById('loading-indicator'),
            formErrorMessageElement: document.getElementById('form-error-message'),
            getCurrentLocationButton: document.getElementById('get-current-location-button'),
            locationFeedbackElement: document.getElementById('location-feedback')
        };
        console.log("[AddStoryPageView] DOM elements cached.");
    }

    initMapInput(locationChangeCallback) {
        console.log("[AddStoryPageView] Initializing location input map...");
        try {
            this.map = setupMapInput('location-map', undefined, locationChangeCallback);
            if (!this.map) throw new Error("Map init returned null.");
            console.log("[AddStoryPageView] Location map initialized.");
            return true;
        }
        catch(error) {
            console.error("[AddStoryPageView] Failed init location map:", error);
            const m = document.getElementById('location-map');
            if(m) showElementError(m, 'Gagal memuat peta lokasi.');
            return false;
        }
    }

    updateSelectedCoordsText(location) {
        const { selectedCoordsElement } = this.domElements;
        if (selectedCoordsElement && location && typeof location.lat === 'number' && typeof location.lon === 'number') {
            selectedCoordsElement.textContent = `Lat: ${location.lat.toFixed(5)}, Lon: ${location.lon.toFixed(5)}`;
            console.log("[AddStoryPageView] Updated coords text:", selectedCoordsElement.textContent);
        } else if (selectedCoordsElement) {
            selectedCoordsElement.textContent = '';
            console.log("[AddStoryPageView] Cleared coords text.");
        }
    }

    updateLocationFeedback(message, isSpinner = false) {
        const { locationFeedbackElement } = this.domElements;
        if(locationFeedbackElement) {
            if(isSpinner) {
                locationFeedbackElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + message;
            } else {
                locationFeedbackElement.textContent = message;
            }
        }
    }

    setGetLocationButtonState(disabled) {
        const { getCurrentLocationButton } = this.domElements;
        if(getCurrentLocationButton) {
            getCurrentLocationButton.disabled = disabled;
        }
    }

    displayPhotoPreview(fileOrBlob) {
        const { photoPreviewElement, photoErrorElement } = this.domElements;
        if (!photoPreviewElement) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreviewElement.src = e.target.result;
            photoPreviewElement.style.display = 'block';
            photoPreviewElement.alt = 'Pratinjau foto yang dipilih';
        };
        reader.onerror = (e) => {
            console.error("[AddStoryPageView] FileReader error:", e);
            showElementError(photoErrorElement, "Gagal membaca file gambar.");
            this.clearPhotoSelection();
        };
        reader.readAsDataURL(fileOrBlob);
    }

    clearPhotoSelection() {
        const { photoPreviewElement, photoFileInput, photoErrorElement } = this.domElements;
        
        if(photoPreviewElement) {
            photoPreviewElement.style.display = 'none';
            photoPreviewElement.src = '#';
            photoPreviewElement.alt = 'Pratinjau foto cerita';
        }
        if(photoFileInput) photoFileInput.value = '';
        clearElementError(photoErrorElement);
        console.log("[AddStoryPageView] Photo selection cleared.");
    }

    startCamera() {
        const { startCameraButton, cameraContainer, capturePhotoButton, videoElement } = this.domElements;
        
        if (!startCameraButton || !cameraContainer || !capturePhotoButton || !videoElement) return Promise.reject(new Error("Missing camera elements"));
        
        cameraContainer.style.display = 'block';
        return startCameraStream(videoElement).then(streamStarted => {
            if (streamStarted) {
                this.isCameraActive = true;
                startCameraButton.innerHTML = '<i class="fas fa-times"></i> Tutup Kamera';
                capturePhotoButton.disabled = false;
                return true;
            } else {
                cameraContainer.style.display = 'none';
                return false;
            }
        });
    }

    stopCamera() {
        const { videoElement, cameraContainer, capturePhotoButton, startCameraButton } = this.domElements;
        
        if(this.isCameraActive && videoElement) {
            stopCameraStream(videoElement);
            if(cameraContainer) cameraContainer.style.display = 'none';
            if(capturePhotoButton) capturePhotoButton.disabled = true;
            if(startCameraButton) startCameraButton.innerHTML = '<i class="fas fa-camera"></i> Gunakan Kamera';
            this.isCameraActive = false;
            console.log("[AddStoryPageView] Camera stream stopped.");
        }
    }

    capturePhotoFromCamera() {
        const { videoElement, canvasElement } = this.domElements;
        if (!videoElement || !canvasElement) return Promise.reject(new Error("Missing video/canvas elements"));
        
        return capturePhoto(videoElement, canvasElement);
    }

    validateForm() {
        const { descriptionInput, descriptionErrorElement, photoErrorElement, isCameraActive, uploadFileButton, capturePhotoButton, startCameraButton } = this.domElements;
        
        this.clearAllErrors();
        let isValid = true;
        
        const description = descriptionInput.value.trim();
        if (!description) {
            showElementError(descriptionErrorElement, 'Deskripsi cerita tidak boleh kosong.', descriptionInput);
            isValid = false;
        }
        
        // Photo validation is now handled by the presenter which has access to the model
        return isValid;
    }

    validatePhoto(hasPhoto) {
        const { photoErrorElement, isCameraActive, uploadFileButton, capturePhotoButton, startCameraButton } = this.domElements;
        
        if (!hasPhoto) {
            showElementError(photoErrorElement, 'Foto cerita wajib diisi (dari kamera atau unggah file).');
            
            if (uploadFileButton && capturePhotoButton && startCameraButton) {
                if (!this.isCameraActive && uploadFileButton) uploadFileButton.focus();
                else if (this.isCameraActive && capturePhotoButton) capturePhotoButton.focus();
                else if (startCameraButton) startCameraButton.focus();
            }
            
            return false;
        }
        return true;
    }

    setFormSubmittingState(isSubmitting) {
        const { loadingIndicator, submitButton, descriptionInput, startCameraButton, capturePhotoButton, uploadFileButton, photoFileInput, getCurrentLocationButton, form } = this.domElements;
        
        const controlsToDisable = [
            descriptionInput, startCameraButton, capturePhotoButton,
            uploadFileButton, photoFileInput, getCurrentLocationButton,
            submitButton
        ];
        
        setLoadingState(loadingIndicator, submitButton, isSubmitting, controlsToDisable);
        this.isSubmitting = isSubmitting;
        
        if (form) {
            if (isSubmitting) {
                form.setAttribute('aria-busy', 'true');
            } else {
                form.removeAttribute('aria-busy');
            }
        }
    }

    showFormError(message) {
        const { formErrorMessageElement } = this.domElements;
        showElementError(formErrorMessageElement, message);
        if (formErrorMessageElement) formErrorMessageElement.focus();
    }

    clearAllErrors() {
        const { formErrorMessageElement, descriptionErrorElement, descriptionInput, photoErrorElement, locationFeedbackElement } = this.domElements;
        
        clearElementError(formErrorMessageElement);
        clearElementError(descriptionErrorElement, descriptionInput);
        clearElementError(photoErrorElement);
        if(locationFeedbackElement) locationFeedbackElement.textContent = '';
    }

    updateMapMarker(lat, lon) {
        if (!this.map) return;
        
        const newLatLng = [lat, lon];
        const popupText = `Lokasi dipilih: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        
        let inputMarker = null;
        this.map.eachLayer(layer => {
            if (layer instanceof L.Marker && layer.options.draggable) {
                inputMarker = layer;
            }
        });
        
        if (inputMarker) {
            console.log('[AddStoryPageView] Updating existing marker.');
            inputMarker.setLatLng(newLatLng).setPopupContent(popupText).openPopup();
        } else {
            console.warn("[AddStoryPageView] Input marker not found, creating a new one.");
            const newMarker = L.marker(newLatLng, { draggable: true }).addTo(this.map);
            newMarker.bindPopup(popupText).openPopup();
            newMarker.on('dragend', (event) => {
                const marker = event.target;
                const pos = marker.getLatLng();
                const newLocation = { lat: pos.lat, lon: pos.lng };
                this.locationChangeCallback(newLocation);
                marker.setPopupContent(`Lokasi dipilih: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`).openPopup();
            });
        }
        
        this.map.setView(newLatLng, 16);
    }

    setLocationChangeCallback(callback) {
        this.locationChangeCallback = callback;
    }

    cleanup() {
        console.log("[AddStoryPageView] Cleaning up resources...");
        this.stopCamera();
        
        if (this.map?.remove) {
            try { 
                this.map.remove(); 
                console.log("[AddStoryPageView] Map instance removed."); 
            } catch (e) {}
        }
        this.map = null;
        
        // Clear all references to DOM elements
        this.domElements = {};
        this.isCameraActive = false;
        this.isSubmitting = false;
        
        console.log("[AddStoryPageView] Cleanup done.");
    }

    focusDescription() {
        const { descriptionInput } = this.domElements;
        if (descriptionInput) descriptionInput.focus();
    }
}