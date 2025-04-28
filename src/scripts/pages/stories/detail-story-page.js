// src/scripts/pages/stories/detail-story-page.js
import { parseActivePathname } from '../../routes/url-parser.js';
import DetailStoryModel from './detail-story-model.js';
import DetailStoryView from './detail-story-view.js';
import DetailStoryPresenter from './detail-story-presenter.js';

export default class DetailStoryPage {
    constructor() {
        this.title = 'Memuat Cerita...';
        this._model = new DetailStoryModel();
        this._view = new DetailStoryView();
        this._presenter = new DetailStoryPresenter(this._view, this._model);
    }

    async render() {
        return this._view.getTemplate();
    }

    async afterRender() {
        const container = this._view.setUp();
        if (!container) {
            return;
        }

        const urlParams = parseActivePathname();
        const storyId = urlParams.id;
        
        await this._presenter.init(storyId);
    }
}