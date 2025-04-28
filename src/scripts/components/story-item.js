import { showFormattedDate, openImageModal } from '../utils/index.js';

class StoryItem extends HTMLElement {
    #story = null;
    #imageContainer = null;

    constructor() { 
        super(); 
    }

    connectedCallback() {
        if (this.#story && !this.hasChildNodes()) { 
            this.render(); 
        }
        this.setAttribute('role', 'article');
        if (this.#story?.id) { 
            this.setAttribute('aria-labelledby', `story-title-${this.#story.id}`); 
        }
        this.setAttribute('tabindex', '0');
        this.removeEventListener('keydown', this.#handleKeyDown);
        this.addEventListener('keydown', this.#handleKeyDown);
        this.removeEventListener('click', this.#handleItemClick);
        this.addEventListener('click', this.#handleItemClick);
        this.#attachImageClickListener();
    }

    disconnectedCallback() {
        this.removeEventListener('keydown', this.#handleKeyDown);
        this.removeEventListener('click', this.#handleItemClick);
        this.#removeImageClickListener();
        // Cleanup object URL if exists
        if (this._objectUrl) {
            URL.revokeObjectURL(this._objectUrl);
            this._objectUrl = null;
        }
    }

    set story(newStoryData) {
        if (!newStoryData || typeof newStoryData !== 'object') {
            console.warn("Invalid story data:", newStoryData);
            this.#story = null;
            if (this.isConnected) { 
                this.innerHTML = '<p class="error-message" style="padding:10px;">Data invalid.</p>'; 
                this.removeAttribute('aria-labelledby'); 
            }
            return;
        }
        this.#story = newStoryData;
        if (this.isConnected) {
            this.render();
            this.#attachImageClickListener();
            if (this.#story.id) { 
                this.setAttribute('aria-labelledby', `story-title-${this.#story.id}`); 
            } else { 
                this.removeAttribute('aria-labelledby'); 
            }
        }
    }

    get story() { 
        return this.#story; 
    }

    async render() {
        if (!this.#story) { 
            this.innerHTML = '<p style="padding:10px;">Memuat...</p>'; 
            return; 
        }

        const { 
            id = `unknown-${Math.random().toString(36).substring(2, 8)}`, 
            name = 'Anonim', 
            description = 'N/A', 
            photoUrl, 
            photoBlob,
            createdAt, 
            lat, 
            lon 
        } = this.#story;

        // Handle image source - prefer blob over URL for offline support
        let imageUrl;
        if (photoBlob) {
            // Cleanup previous object URL if exists
            if (this._objectUrl) {
                URL.revokeObjectURL(this._objectUrl);
            }
            this._objectUrl = URL.createObjectURL(photoBlob);
            imageUrl = this._objectUrl;
        } else {
            imageUrl = photoUrl || 'images/placeholder.png';
        }

        const fallbackImage = 'images/placeholder.png';
        let formattedDateTime = 'N/A'; 
        if (createdAt) { 
            try { 
                formattedDateTime = showFormattedDate(createdAt); 
                if (formattedDateTime.includes('Invalid') || formattedDateTime.includes('Error')) { 
                    throw new Error(); 
                } 
            } catch (e) { 
                formattedDateTime = 'Tgl Error'; 
            } 
        }

        const hasLocation = typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon);
        const locationText = hasLocation ? 'Dengan Lokasi' : '';
        const locationIcon = hasLocation ? 'fas fa-map-marker-alt' : '';

        this.setAttribute('data-id', id);

        this.innerHTML = `
            <div class="story-item__image-container" role="button" aria-label="Perbesar gambar cerita oleh ${name}">
                <img src="${imageUrl}" 
                     alt="Cerita oleh ${name}" 
                     class="story-item__image" 
                     onerror="this.onerror=null; this.src='${fallbackImage}'; this.alt='Gagal memuat gambar cerita oleh ${name}';" 
                     loading="lazy">
            </div>
            <div class="story-item__content">
                <div class="story-item__meta">
                    <span class="story-item__author" id="story-title-${id}">${name || 'Tanpa Nama'}</span>
                    ${hasLocation ? `<span class="story-item__location"><i class="${locationIcon}" aria-hidden="true"></i> ${locationText}</span>` : ''}
                </div>
                <p class="story-item__description">${description}</p>
                <time class="story-item__timestamp" datetime="${createdAt || ''}">${formattedDateTime}</time>
            </div>
        `;
        
        this.#imageContainer = this.querySelector('.story-item__image-container');
    }

    #attachImageClickListener() {
        this.#removeImageClickListener();
        if (this.#imageContainer) {
            this.#imageContainer.addEventListener('click', this.#handleImageClick);
        }
    }

    #removeImageClickListener() {
        if (this.#imageContainer) {
            this.#imageContainer.removeEventListener('click', this.#handleImageClick);
        }
    }

    #handleImageClick = (event) => {
        event.stopPropagation();
        if (this.#story) {
            // Use blob URL if available, otherwise fall back to photoUrl
            const imageUrl = this._objectUrl || this.#story.photoUrl;
            if (imageUrl) {
                openImageModal(imageUrl, `Cerita oleh ${this.#story.name || 'Anonim'}`);
            }
        }
    }

    #handleKeyDown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.#navigateToDetail();
        }
    }

    #handleItemClick = (event) => {
        if (event.target.closest('.story-item__image-container')) {
            return;
        }
        this.#navigateToDetail();
    }

    #navigateToDetail = () => {
        const storyId = this.dataset.id;
        if (storyId && !storyId.startsWith('unknown-')) {
            console.log(`Navigating to detail for story ID ${storyId}`);
            location.hash = `#/stories/${storyId}`;
        } else {
            console.warn("Cannot navigate: Story ID is missing or invalid on this item.", this.#story);
            alert("Tidak dapat membuka detail cerita ini (ID tidak valid).");
        }
    }
}

if (!customElements.get('story-item')) { 
    customElements.define('story-item', StoryItem); 
}