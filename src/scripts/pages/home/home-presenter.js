import CONFIG from '../../config.js';

export default class HomePresenter {
    #model = null;
    #view = null;
  
    constructor({ model, view }) {
      this.#model = model;
      this.#view = view;
      console.log("[Home Presenter] Initialized");
    }
  
    async init() {
      if (!this.#view.init()) {
        console.error("[Home Presenter] View initialization failed");
        return;
      }
  
      // Set up map observer with callback
      this.#view.setupMapObserver(() => this.#initializeMap());
      
      // Load initial stories
      await this.#loadInitialStories();
      
      // Attach event listeners
      this.#attachEventListeners();
    }
  
    async #loadInitialStories() {
      try {
        const { stories, allLoaded } = await this.#model.fetchInitialStories();
        
        this.#view.removeSkeletonLoaders();
        
        if (stories.length === 0) {
          this.#view.showNoStoriesMessage();
        } else {
          this.#view.renderStoryItems(stories);
          this.#view.showLoadMoreButton(!allLoaded);
          
          // If map is already initialized, update markers
          if (this.#isMapInitialized()) {
            this.#updateMapMarkers();
          }
        }
      } catch (error) {
        this.#view.showStoryLoadError(error);
      }
    }
  
    async #loadMoreStories() {
      this.#view.setLoadMoreButtonLoading(true);
      
      try {
        const { stories, allLoaded } = await this.#model.fetchMoreStories();
        
        if (stories.length > 0) {
          this.#view.renderStoryItems(stories, true);
          
          if (this.#isMapInitialized()) {
            this.#updateMapMarkers();
          }
        }
        
        this.#view.showLoadMoreButton(!allLoaded);
      } catch (error) {
        this.#view.showLoadMoreError(error);
      } finally {
        this.#view.setLoadMoreButtonLoading(false);
      }
    }
  
    #initializeMap() {
      const success = this.#view.initMap();
      
      if (success) {
        const stories = this.#model.getStories();
        if (stories.length > 0) {
          this.#updateMapMarkers();
        }
      }
    }
  
    #isMapInitialized() {
      // This is a simple check - the actual implementation will depend on how your view manages the map
      return true; // The view will handle the null check
    }
  
    #updateMapMarkers() {
      const stories = this.#model.getStories();
      this.#view.populateMapMarkers(stories);
    }
  
    #attachEventListeners() {
      // Attach load more button click event
      this.#view.attachLoadMoreEvent(() => this.#loadMoreStories());
      
      // Attach cleanup events
      window.removeEventListener('hashchange', this.cleanup);
      window.removeEventListener('beforeunload', this.cleanup);
      window.addEventListener('hashchange', this.cleanup.bind(this), { once: true });
      window.addEventListener('beforeunload', this.cleanup.bind(this));
      
      console.log("[Home Presenter] Event listeners attached");
    }
  
    async cleanup() {
      console.log("[Home Presenter] Cleaning up resources...");
      
      // Clean up view
      if (this.#view) {
        this.#view.cleanup();
      }
      
      // Reset model state
      if (this.#model) {
        this.#model.resetState();
      }
      
      // Remove window event listeners
      window.removeEventListener('beforeunload', this.cleanup);
      window.removeEventListener('hashchange', this.cleanup);
      
      console.log("[Home Presenter] Cleanup complete");
    }
  
    async handleNotificationToggle() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const existingSubscription = await registration.pushManager.getSubscription();

            if (existingSubscription) {
                // Unsubscribe flow
                await this.#model.unsubscribeFromNotifications(existingSubscription.endpoint);
                await existingSubscription.unsubscribe();
                console.log('[Home Presenter] Successfully unsubscribed from notifications');
                return false;
            } else {
                // Subscribe flow
                const vapidKey = CONFIG.VAPID_PUBLIC_KEY;
                console.log('[Home Presenter] Subscribing with VAPID key:', vapidKey);

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.#urlBase64ToUint8Array(vapidKey)
                });

                const result = await this.#model.subscribeToNotifications(subscription);
                console.log('[Home Presenter] Subscription result:', result);
                return true;
            }
        } catch (error) {
            console.error('[Home Presenter] Notification toggle failed:', error);
            throw error;
        }
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
}