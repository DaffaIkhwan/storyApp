import { showSuccessMessage, showErrorMessage } from '../../utils/ui-utils.js';

export default class AddStoryPagePresenter {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        console.log("[AddStoryPagePresenter] Initialized.");
    }

    init() {
        console.log("[AddStoryPagePresenter] Initializing...");
        this.setupEventListeners();
        this.setupMapInput();
        this.view.focusDescription();
    }

    setupEventListeners() {
        const { 
            form, startCameraButton, capturePhotoButton, 
            uploadFileButton, photoFileInput, getCurrentLocationButton 
        } = this.view.domElements;
        
        if (form) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
        }
        
        if (startCameraButton) {
            startCameraButton.addEventListener('click', this.handleStartCameraButtonClick.bind(this));
        }
        
        if (capturePhotoButton) {
            capturePhotoButton.addEventListener('click', this.handleCapturePhotoButtonClick.bind(this));
        }
        
        if (uploadFileButton && photoFileInput) {
            uploadFileButton.addEventListener('click', () => photoFileInput.click());
            photoFileInput.addEventListener('change', this.handleFileInputChange.bind(this));
        }
        
        if (getCurrentLocationButton) {
            getCurrentLocationButton.addEventListener('click', this.handleGetCurrentLocationClick.bind(this));
        }
        
        // Attach cleanup listeners
        window.addEventListener('beforeunload', this.cleanup.bind(this));
        window.addEventListener('hashchange', this.cleanup.bind(this));
        
        console.log("[AddStoryPagePresenter] Event listeners attached.");
    }

    setupMapInput() {
        // Add callback for location changes
        this.view.setLocationChangeCallback((location) => {
            this.model.setLocation(location);
            this.view.updateSelectedCoordsText(location);
            this.view.updateLocationFeedback('');
        });
        
        this.view.initMapInput((location) => {
            this.model.setLocation(location);
            this.view.updateSelectedCoordsText(location);
            this.view.updateLocationFeedback('');
        });
    }

    handleFormSubmit(event) {
        event.preventDefault();
        console.log('[AddStoryPagePresenter] Handling form submit...');
        
        if (this.view.isSubmitting) {
            console.warn('[AddStoryPagePresenter] Already submitting, ignoring.');
            return;
        }

        const isFormValid = this.view.validateForm();
        const isPhotoValid = this.view.validatePhoto(this.model.hasPhoto());
        
        if (!isFormValid || !isPhotoValid) {
            this.view.showFormError('Periksa kembali isian form yang wajib diisi.');
            const firstError = this.view.domElements.form.querySelector('[aria-invalid="true"]');
            if (firstError) {
                firstError.focus();
            } else {
                this.view.domElements.formErrorMessageElement.focus();
            }
            return;
        }

        const description = this.view.domElements.descriptionInput.value.trim();
        this.view.setFormSubmittingState(true);

        this.model.submitStory({ description })
            .then(() => {
                console.log('[AddStoryPagePresenter] addNewStory API success.');
                showSuccessMessage('Cerita baru berhasil dibagikan!');
                this.cleanup();
                setTimeout(() => { location.hash = '#/'; }, 1500);
            })
            .catch(e => {
                console.error('[AddStoryPagePresenter] Error submitting story:', e);
                this.view.showFormError(`Gagal mengirim cerita: ${e.message}`);
                this.view.setFormSubmittingState(false);
            });
    }

    handleStartCameraButtonClick() {
        const { startCameraButton } = this.view.domElements;
        if (!startCameraButton) return;
        
        startCameraButton.disabled = true;
        this.view.clearAllErrors();
        
        try {
            if (this.view.isCameraActive) {
                this.view.stopCamera();
            } else {
                this.view.clearPhotoSelection();
                this.model.clearPhotoFile();
                
                this.view.startCamera()
                    .catch(e => {
                        console.error("[AddStoryPagePresenter] Error starting camera:", e);
                        this.view.showFormError(`Kesalahan Kamera: ${e.message}`);
                        this.view.stopCamera();
                    });
            }
        } catch (e) {
            console.error("[AddStoryPagePresenter] Error toggling camera:", e);
            this.view.showFormError(`Kesalahan Kamera: ${e.message}`);
            this.view.stopCamera();
        } finally {
            startCameraButton.disabled = false;
        }
    }

    handleCapturePhotoButtonClick() {
        const { capturePhotoButton } = this.view.domElements;
        if (!capturePhotoButton) return;
        
        capturePhotoButton.disabled = true;
        this.view.clearAllErrors();
        
        this.view.capturePhotoFromCamera()
            .then(photoFile => {
                if (photoFile) {
                    this.model.setPhotoFile(photoFile);
                    this.view.displayPhotoPreview(photoFile);
                    this.view.stopCamera();
                    this.view.focusDescription();
                } else {
                    this.view.showElementError(this.view.domElements.photoErrorElement, 'Gagal mengambil foto dari kamera.');
                    capturePhotoButton.disabled = false;
                }
            })
            .catch(e => {
                console.error("[AddStoryPagePresenter] Error capturing photo:", e);
                this.view.showElementError(this.view.domElements.photoErrorElement, `Error pengambilan foto: ${e.message}`);
                capturePhotoButton.disabled = false;
            });
    }

    handleFileInputChange(event) {
        const { photoFileInput, photoErrorElement } = this.view.domElements;
        if (!event.target.files?.[0]) return;
        
        const file = event.target.files[0];
        this.view.clearAllErrors();
        
        if (file) {
            const maxSizeMB = 1;
            if (file.size > maxSizeMB * 1024 * 1024) {
                this.view.showElementError(photoErrorElement, `Ukuran file melebihi ${maxSizeMB}MB.`);
                photoFileInput.value = '';
                this.view.clearPhotoSelection();
                this.model.clearPhotoFile();
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                this.view.showElementError(photoErrorElement, 'File yang dipilih bukan gambar.');
                photoFileInput.value = '';
                this.view.clearPhotoSelection();
                this.model.clearPhotoFile();
                return;
            }
            
            this.model.setPhotoFile(file);
            this.view.displayPhotoPreview(file);
            this.view.stopCamera();
            this.view.focusDescription();
        }
    }

    handleGetCurrentLocationClick() {
        console.log('[Geolocation] "Gunakan Lokasi Saya" button clicked.');
        
        if (!navigator.geolocation) {
            console.error('[Geolocation] navigator.geolocation is NOT available.');
            showErrorMessage('Browser Anda tidak mendukung Geolocation.');
            this.view.updateLocationFeedback('Geolocation tidak didukung.');
            return;
        }
        console.log('[Geolocation] navigator.geolocation IS available.');

        if (!this.view.map) {
            console.error('[Geolocation] Map instance is not ready.');
            showErrorMessage('Peta belum siap. Silakan tunggu sebentar.');
            this.view.updateLocationFeedback('Peta belum siap.');
            return;
        }
        console.log('[Geolocation] Map instance IS ready.');

        this.view.updateLocationFeedback('Mencari lokasi...', true);
        this.view.setGetLocationButtonState(true);
        this.view.clearAllErrors();

        const options = {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 0
        };
        console.log('[Geolocation] Attempting navigator.geolocation.getCurrentPosition with options:', options);

        navigator.geolocation.getCurrentPosition(
            this.geolocationSuccess.bind(this),
            this.geolocationError.bind(this),
            options
        );
        console.log('[Geolocation] navigator.geolocation.getCurrentPosition call initiated.');
    }

    geolocationSuccess(position) {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        console.log(`[Geolocation] Success - Extracted Coords: Lat: ${lat}, Lon: ${lon}`);

        const location = { lat, lon };
        this.model.setLocation(location);
        this.view.updateSelectedCoordsText(location);
        this.view.updateLocationFeedback('Lokasi ditemukan!');
        this.view.setGetLocationButtonState(false);
        
        this.view.updateMapMarker(lat, lon);

        setTimeout(() => {
            if (this.view.domElements.locationFeedbackElement && 
                this.view.domElements.locationFeedbackElement.textContent === 'Lokasi ditemukan!') {
                this.view.updateLocationFeedback('');
            }
        }, 2500);
    }

    geolocationError(error) {
        console.error("[Geolocation] Handling error within geolocationError. Error code:", error.code, "Message:", error.message);
        
        let message = 'Tidak dapat mengambil lokasi Anda.';
        switch(error.code) {
            case error.PERMISSION_DENIED: message = "Anda menolak izin akses lokasi."; break;
            case error.POSITION_UNAVAILABLE: message = "Informasi lokasi tidak tersedia."; break;
            case error.TIMEOUT: message = "Waktu habis saat mencoba mengambil lokasi."; break;
        }
        
        this.view.updateLocationFeedback(`Error: ${message}`);
        showErrorMessage(`Gagal mendapatkan lokasi: ${message}`);
        this.view.setGetLocationButtonState(false);
        console.log("[Geolocation] Finished handling error.");
    }

    cleanup() {
        console.log("[AddStoryPagePresenter] Cleaning up...");
        window.removeEventListener('beforeunload', this.cleanup.bind(this));
        window.removeEventListener('hashchange', this.cleanup.bind(this));
        this.view.cleanup();
    }
}