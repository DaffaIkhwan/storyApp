// src/scripts/pages/offline/offline-page-model.js
import { getAllOfflineStories, deleteOfflineStory } from '../../utils/idb-utils';

export default class OfflinePageModel {
  #stories = [];

  async loadStories() {
    try {
      this.#stories = await getAllOfflineStories();
      // Validasi data story
      this.#stories.forEach(story => {
        if (!story.photoBlob && !story.photoUrl) {
          console.warn(`Story ${story.id} missing both photoBlob and photoUrl`);
        }
      });
      return this.#stories;
    } catch (error) {
      console.error("Error loading offline stories:", error);
      throw error;
    }
  }

  getStories() {
    return this.#stories;
  }

  async deleteStory(storyId) {
    try {
      await deleteOfflineStory(storyId);
      this.#stories = this.#stories.filter(s => s.id !== storyId);
      return true;
    } catch (error) {
      console.error("Error deleting offline story:", error);
      throw error;
    }
  }

  findStory(storyId) {
    return this.#stories.find(s => s.id === storyId);
  }

  isEmpty() {
    return this.#stories.length === 0;
  }
}