// src/scripts/pages/stories/detail-story-model.js
import { getStoryDetail } from '../../data/api.js';
import { saveStoryForOffline, getOfflineStoryById, deleteOfflineStory } from '../../utils/idb-utils.js';

export default class DetailStoryModel {
    constructor() {
        this._story = null;
        this._isSavedOffline = false;
    }

    async fetchStory(storyId) {
        try {
            const result = await getStoryDetail(storyId);
            if (result.error || !result.story) {
                throw new Error(result.message || 'Data cerita tidak ditemukan.');
            }
            this._story = result.story;
            return this._story;
        } catch (error) {
            // Try to get offline version if online fetch fails
            const offlineStory = await this.getOfflineStory(storyId);
            if (offlineStory) {
                this._story = offlineStory;
                this._isSavedOffline = true;
                return this._story;
            }
            throw error;
        }
    }

    async getOfflineStory(storyId) {
        return await getOfflineStoryById(storyId);
    }

    async checkOfflineStatus(storyId) {
        try {
            const offlineStory = await getOfflineStoryById(storyId);
            this._isSavedOffline = !!offlineStory;
            return this._isSavedOffline;
        } catch (e) {
            this._isSavedOffline = false;
            return false;
        }
    }

    async saveStoryOffline() {
        if (!this._story) return false;
        await saveStoryForOffline(this._story);
        this._isSavedOffline = true;
        return true;
    }

    async deleteStoryOffline() {
        if (!this._story) return false;
        await deleteOfflineStory(this._story.id);
        this._isSavedOffline = false;
        return true;
    }

    getStory() {
        return this._story;
    }

    isOfflineSaved() {
        return this._isSavedOffline;
    }

    setStory(story) {
        this._story = story;
    }

    setOfflineStatus(status) {
        this._isSavedOffline = status;
    }
}