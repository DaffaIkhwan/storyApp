// src\scripts\pages\home\home-view.js
import { showElementError, clearElementError, showErrorMessage, showSuccessMessage } from '../../utils/ui-utils.js';
import { initMap, addMarker, clearMarkers } from '../../utils/map-utils.js';
import CONFIG from '../../config.js';

export default class HomeView {
  #map = null;
  #storiesListElement = null;
  #mapContainerElement = null;
  #mapFeedbackElement = null;
  #observer = null;
  #loadMoreButton = null;
  #loadMoreContainer = null;
  #skeletonContainer = null;
  #loadMoreClickCallback = null;
  #notificationButton = null;

  constructor() {
    console.log("[Home View] Initialized");
  }

  init() {
    this.#cacheDOMElements();
    if (!this.#storiesListElement || !this.#mapContainerElement || 
        !this.#mapFeedbackElement || !this.#loadMoreContainer || 
        !this.#loadMoreButton || !this.#notificationButton) {
      console.error("[Home View] Required elements not found in DOM after render.");
      return false;
    }
    
    this.#renderSkeletonLoaders();
    this.#initNotificationButton();
    this.#mapFeedbackElement.innerHTML = '<small>Memuat data peta...</small>';
    
    const mapDiv = document.getElementById('story-map');
    if (mapDiv) { 
      this.setContentBusy(mapDiv, true, 'Memuat peta...'); 
    }
    
    return true;
  }

  #cacheDOMElements() {
    this.#storiesListElement = document.getElementById('stories-list');
    this.#mapContainerElement = document.getElementById('map-container-element');
    this.#mapFeedbackElement = document.getElementById('map-feedback');
    this.#loadMoreContainer = document.getElementById('load-more-container');
    this.#loadMoreButton = document.getElementById('load-more-button');
    this.#notificationButton = document.getElementById('notification-toggle-btn');
  }

  #renderSkeletonLoaders() {
    if (!this.#storiesListElement) return;
    
    this.#storiesListElement.innerHTML = '';
    this.#storiesListElement.removeAttribute('aria-busy');

    this.#skeletonContainer = document.createElement('div');
    this.#skeletonContainer.className = 'skeleton-container';
    this.#storiesListElement.appendChild(this.#skeletonContainer);

    // Default to 9 skeleton items (per the original code)
    const skeletonCount = 9;
    for (let i = 0; i < skeletonCount; i++) {
      const skeletonItem = document.createElement('div');
      skeletonItem.className = 'skeleton-item';
      skeletonItem.innerHTML = `
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton skeleton-line skeleton-line--title"></div>
          <div class="skeleton skeleton-line skeleton-line--small"></div>
          <div class="skeleton skeleton-line skeleton-line--text"></div>
          <div class="skeleton skeleton-line skeleton-line--text"></div>
        </div>
      `;
      this.#skeletonContainer.appendChild(skeletonItem);
    }
    
    this.#storiesListElement.setAttribute('aria-busy', 'true');
  }

  removeSkeletonLoaders() {
    if (this.#skeletonContainer && this.#storiesListElement) {
      try {
        this.#storiesListElement.removeChild(this.#skeletonContainer);
      } catch(e) {}
      
      this.#skeletonContainer = null;
      this.#storiesListElement.removeAttribute('aria-busy');
    }
  }

  setupMapObserver(observerCallback) {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
      console.log("[Observer] Previous observer disconnected.");
    }
    
    this.removeMapInstance();
    
    this.#observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        console.log("[Observer] Map container is visible, initializing map...");
        if (this.#observer) this.#observer.disconnect();
        observerCallback();
      }
    }, { rootMargin: '200px', threshold: 0.01 });
    
    if (this.#mapContainerElement) {
      this.#observer.observe(this.#mapContainerElement);
      console.log("[Observer] Observing map container.");
    } else {
      console.warn("[Observer] Map container element not found.");
    }
  }

  initMap() {
    try {
      const mapElementId = 'story-map';
      const mapDiv = document.getElementById(mapElementId);
      
      if (mapDiv) {
        this.setContentBusy(mapDiv, false);
      }
      
      this.#map = initMap(mapElementId);
      
      if (this.#map) {
        if (this.#mapFeedbackElement) {
          this.#mapFeedbackElement.innerHTML = '<small>Peta siap.</small>';
        }
        return true;
      } else {
        if (this.#mapFeedbackElement) {
          showElementError(this.#mapFeedbackElement, 'Gagal memuat peta.');
        }
        return false;
      }
    } catch (mapError) {
      console.error("[Observer] Error initializing map:", mapError);
      if (this.#mapFeedbackElement) {
        showElementError(this.#mapFeedbackElement, 'Gagal memuat peta.');
      }
      return false;
    }
  }

  renderStoryItems(storiesToRender, append = false) {
    if (!this.#storiesListElement) return;
    
    if (!append) {
      this.#storiesListElement.innerHTML = '';
    }

    const fragment = document.createDocumentFragment();
    
    storiesToRender.forEach(story => {
      try {
        const storyItemElement = document.createElement('story-item');
        storyItemElement.story = story;
        fragment.appendChild(storyItemElement);
      } catch (elementError) {
        console.error("Error creating story-item:", elementError, story);
        const errorItem = document.createElement('div');
        errorItem.textContent = 'Gagal memuat cerita.';
        errorItem.className = 'error-message';
        errorItem.style.border = '1px dashed red';
        errorItem.style.padding = '10px';
        fragment.appendChild(errorItem);
      }
    });
    
    this.#storiesListElement.appendChild(fragment);
    this.#storiesListElement.removeAttribute('aria-busy');
  }

  showNoStoriesMessage() {
    if (this.#storiesListElement) {
      this.#storiesListElement.innerHTML = '<p style="text-align: center; padding: 20px; color: #555;">Belum ada cerita untuk ditampilkan.</p>';
    }
    
    if (this.#loadMoreContainer) {
      this.#loadMoreContainer.style.display = 'none';
    }
  }

  showLoadMoreError(error) {
    showErrorMessage(`Gagal memuat lebih banyak cerita: ${error.message}`);
  }

  showLoadMoreButton(show) {
    if (this.#loadMoreContainer) {
      this.#loadMoreContainer.style.display = show ? 'block' : 'none';
    }
  }

  setLoadMoreButtonLoading(isLoading) {
    if (!this.#loadMoreButton) return;
    
    this.#loadMoreButton.disabled = isLoading;
    this.#loadMoreButton.innerHTML = isLoading 
      ? '<span class="spinner spinner--small"></span> Memuat...'
      : 'Muat Lebih Banyak';
  }

  showStoryLoadError(error) {
    this.removeSkeletonLoaders();
    
    if (this.#storiesListElement) {
      this.#storiesListElement.innerHTML = '';
      const errorContainer = document.createElement('div');
      errorContainer.style.padding = '20px';
      errorContainer.id = 'story-list-error';
      showElementError(errorContainer, `Gagal memuat cerita: ${error.message}.`);
      this.#storiesListElement.appendChild(errorContainer);
      errorContainer.focus();
    }
    
    if (this.#mapFeedbackElement) {
      showElementError(this.#mapFeedbackElement, 'Gagal memuat data cerita.');
    }
    
    if (this.#observer && this.#mapContainerElement) {
      this.#observer.unobserve(this.#mapContainerElement);
    }
    
    if (this.#loadMoreContainer) {
      this.#loadMoreContainer.style.display = 'none';
    }
  }

  populateMapMarkers(stories) {
    if (!this.#map || !stories || !this.#mapFeedbackElement) return;
    
    console.log("[Home View] Populating map markers based on all loaded stories...");
    clearMarkers();
    
    let markersAdded = 0;
    
    stories.forEach(story => {
      const isValidCoordinate = (c) => typeof c === 'number' && !isNaN(c);
      
      if (isValidCoordinate(story.lat) && isValidCoordinate(story.lon)) {
        try {
          const popupContent = `
            <div style="max-width:180px; font-family: var(--font-family-sans);">
              <img src="${story.photoUrl || 'images/placeholder.png'}" alt="Mini preview" width="150" style="width:100%; height:auto; margin-bottom:8px; border-radius:3px; object-fit: cover;" onerror="this.onerror=null;this.src='images/placeholder.png';">
              <strong style="display:block; margin-bottom:3px; font-size: 0.95rem; color: var(--primary-color);">${story.name||'Anonim'}</strong>
              <small style="color:var(--medium-text); display: block; font-size: 0.8rem; max-height: 3.2em; overflow: hidden;" title="${story.description||''}">${(story.description||'').substring(0,50)}...</small>
            </div>`;
          addMarker([story.lat, story.lon], popupContent);
          markersAdded++;
        } catch(markerError){ 
          console.warn("Error adding marker:", story.id, markerError); 
        }
      }
    });
    
    console.log(`[Home View] ${markersAdded} markers added/updated.`);
    clearElementError(this.#mapFeedbackElement);
    
    if (markersAdded > 0) {
      this.#mapFeedbackElement.innerHTML = `<small>${markersAdded} cerita dengan lokasi ditampilkan.</small>`;
    } else if (stories.length > 0) {
      this.#mapFeedbackElement.innerHTML = '<small><em>Tidak ada cerita dengan lokasi valid saat ini.</em></small>';
    } else {
      this.#mapFeedbackElement.innerHTML = '<small>Peta siap.</small>';
    }
  }

  removeMapInstance() {
    if (this.#map?.remove) {
      try { 
        console.log("[Home View] Removing map instance.");
        clearMarkers();
        this.#map.remove();
      } catch (e) {}
    }
    
    this.#map = null;
  }

  setContentBusy(element, isBusy, message = '') {
    if (!element) return;
    
    const indicatorClass = 'content-loading-indicator';
    let loadingEl = element.querySelector(`.${indicatorClass}`);
    
    if (isBusy) {
      element.setAttribute('aria-busy', 'true');
      
      if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.className = indicatorClass;
        loadingEl.setAttribute('role', 'status');
        loadingEl.innerHTML = `<p>${message}</p>`;
        element.innerHTML = '';
        element.appendChild(loadingEl);
      }
      
      loadingEl.style.display = 'flex';
    } else {
      element.removeAttribute('aria-busy');
      
      if (loadingEl) {
        try {
          element.removeChild(loadingEl);
        } catch(e) {}
      }
    }
  }

  attachLoadMoreEvent(callback) {
    this.#loadMoreClickCallback = callback;
    
    if (this.#loadMoreButton) {
      this.#loadMoreButton.removeEventListener('click', this.#handleLoadMoreClick);
      this.#loadMoreButton.addEventListener('click', this.#handleLoadMoreClick);
    }
  }

  #handleLoadMoreClick = () => {
    if (this.#loadMoreClickCallback) {
      this.#loadMoreClickCallback();
    }
  }

  async #initNotificationButton() {
    if (!this.#notificationButton) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      this.#updateNotificationButtonState(!!subscription);
      this.#notificationButton.addEventListener('click', () => this.#handleNotificationToggle());
    } catch (error) {
      console.error('Failed to initialize notification button:', error);
      this.#notificationButton.style.display = 'none';
    }
  }

  #updateNotificationButtonState(isSubscribed) {
    if (!this.#notificationButton) return;

    this.#notificationButton.textContent = isSubscribed ? 
        'Berhenti Berlangganan' : 'Aktifkan Notifikasi';
    this.#notificationButton.classList.toggle('subscribed', isSubscribed);
  }

  async #handleNotificationToggle() {
    if (!this.#notificationButton) return;

    // Gunakan dicoding_story_auth_token sebagai sumber token
    const token = localStorage.getItem('dicoding_story_auth_token');
    if (!token) {
        showErrorMessage('Silakan login terlebih dahulu');
        return;
    }

    try {
        this.#notificationButton.disabled = true;
        this.#notificationButton.textContent = 'Memproses...';

        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
            // Unsubscribe process
            await this.#unsubscribeFromNotifications(existingSubscription, token);
            this.#updateNotificationButtonState(false);
            showSuccessMessage('Berhasil berhenti berlangganan notifikasi!');
        } else {
            // Subscribe process
            const result = await this.#subscribeToNotifications(registration, token);
            if (result && !result.error) {
                this.#updateNotificationButtonState(true);
                showSuccessMessage('Berhasil berlangganan notifikasi!');
            } else {
                throw new Error('Gagal berlangganan notifikasi');
            }
        }
    } catch (error) {
        console.error('Notification toggle failed:', error);
        showErrorMessage(error.message);
        // Reset button state based on actual subscription
        const currentSubscription = await navigator.serviceWorker.ready
            .then(reg => reg.pushManager.getSubscription());
        this.#updateNotificationButtonState(!!currentSubscription);
    } finally {
        if (this.#notificationButton) {
            this.#notificationButton.disabled = false;
            this.#notificationButton.textContent = this.#notificationButton.classList.contains('subscribed') 
                ? 'Berhenti Berlangganan' 
                : 'Aktifkan Notifikasi';
        }
    }
}

async #subscribeToNotifications(registration, token) {
    try {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Izin notifikasi ditolak');
        }

        // Subscribe to push service
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.#urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY)
        });

        // Send subscription to server
        const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.toJSON().keys.p256dh,
                    auth: subscription.toJSON().keys.auth
                }
            })
        });

        if (!response.ok) {
            throw new Error('Gagal mendaftar ke layanan notifikasi');
        }

        return await response.json();
    } catch (error) {
        console.error('Subscription error:', error);
        throw error;
    }
}

async #unsubscribeFromNotifications(subscription, token) {
    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            endpoint: subscription.endpoint
        })
    });

    if (!response.ok) {
        throw new Error('Gagal berhenti berlangganan dari layanan notifikasi');
    }

    await subscription.unsubscribe();
}
#urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

  cleanup() {
    console.log("[Home View] Cleaning up resources...");
    
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
      console.log("[Home View] Observer disconnected.");
    }
    
    this.removeMapInstance();
    
    if (this.#loadMoreButton) {
      this.#loadMoreButton.removeEventListener('click', this.#handleLoadMoreClick);
    }
    if (this.#notificationButton) {
      this.#notificationButton.removeEventListener('click', this.#handleNotificationToggle);
    }
    this.#storiesListElement = null;
    this.#mapContainerElement = null;
    this.#mapFeedbackElement = null;
    this.#loadMoreButton = null;
    this.#loadMoreContainer = null;
    this.#skeletonContainer = null;
    this.#loadMoreClickCallback = null;
    this.#notificationButton = null;
    
    console.log("[Home View] View cleanup complete.");
  }
}