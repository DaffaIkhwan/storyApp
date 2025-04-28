// src\scripts\pages\home\home-model.js
import CONFIG from '../../config.js';
import { getAllStories } from '../../data/api.js';  // Add this import

export default class HomeModel {
  #stories = [];
  #currentPage = 1;
  #storiesPerPage = 9;
  #isLoadingMore = false;
  #allStoriesLoaded = false;

  constructor() {
    console.log("[Home Model] Initialized");
  }

  async fetchInitialStories() {
    try {
      console.log("[Home Model] Fetching initial stories...");
      const result = await getAllStories({ page: 1, size: this.#storiesPerPage, location: 0 });
      this.#stories = result.listStory || [];
      console.log(`[Home Model] Fetched ${this.#stories.length} initial stories.`);

      this.#allStoriesLoaded = this.#stories.length < this.#storiesPerPage;
      
      return {
        stories: this.#stories,
        allLoaded: this.#allStoriesLoaded
      };
    } catch (error) {
      console.error('[Home Model] Error fetching initial stories:', error);
      throw error;
    }
  }

  async fetchMoreStories() {
    if (this.#isLoadingMore || this.#allStoriesLoaded) {
      return { stories: [], allLoaded: this.#allStoriesLoaded };
    }

    try {
      this.#isLoadingMore = true;
      this.#currentPage += 1;
      console.log(`[Home Model] Fetching page ${this.#currentPage}...`);

      const result = await getAllStories({ 
        page: this.#currentPage, 
        size: this.#storiesPerPage, 
        location: 0 
      });
      
      const newStories = result.listStory || [];
      console.log(`[Home Model] Fetched ${newStories.length} more stories.`);

      if (newStories.length > 0) {
        this.#stories = [...this.#stories, ...newStories];
      }

      this.#allStoriesLoaded = newStories.length < this.#storiesPerPage;
      
      return {
        stories: newStories,
        allLoaded: this.#allStoriesLoaded
      };
    } catch (error) {
      console.error(`[Home Model] Error fetching page ${this.#currentPage}:`, error);
      this.#currentPage -= 1;
      throw error;
    } finally {
      this.#isLoadingMore = false;
    }
  }

  getStories() {
    return this.#stories;
  }

  resetState() {
    this.#stories = [];
    this.#currentPage = 1;
    this.#isLoadingMore = false;
    this.#allStoriesLoaded = false;
  }

  async subscribeToNotifications(subscription) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Unauthorized: No token found');
    }

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

    const responseJson = await response.json();
    
    if (responseJson.error) {
        throw new Error(responseJson.message);
    }

    console.log('[Home Model] Subscription success:', responseJson);
    return responseJson.data;
}

async unsubscribeFromNotifications(endpoint) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Unauthorized: No token found');
    }

    const response = await fetch(`${CONFIG.BASE_URL}/notifications/subscribe`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint })
    });

    const responseJson = await response.json();
    
    if (responseJson.error) {
        throw new Error(responseJson.message);
    }

    console.log('[Home Model] Unsubscription success:', responseJson);
    return responseJson;
}
}