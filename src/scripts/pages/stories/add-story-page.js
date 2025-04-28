import AddStoryPageModel from './add-story-page-model.js';
import AddStoryPageView from './add-story-page-view.js';
import AddStoryPagePresenter from './add-story-page-presenter.js';

export default class AddStoryPage {
    constructor() {
        this.title = 'Tambah Cerita - Dicoding Story App';
        this.model = null;
        this.view = null;
        this.presenter = null;
        console.log("[AddStoryPage] Constructor finished.");
    }

    async render() {
        console.log("[AddStoryPage] Rendering...");
        // Create the view instance to render the HTML
        this.view = new AddStoryPageView();
        return this.view.render();
    }

    async afterRender() {
        console.log("[AddStoryPage] afterRender started");
        
        // Initialize the full MVP structure
        this.model = new AddStoryPageModel();
        
        // Complete the view initialization with DOM elements
        this.view.cacheDOMElements();
        
        // Create and initialize the presenter
        this.presenter = new AddStoryPagePresenter(this.model, this.view);
        this.presenter.init();
        
        console.log("[AddStoryPage] afterRender finished.");
    }
}