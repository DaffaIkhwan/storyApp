import { addNewStory } from '../../data/api.js';

export default class AddStoryPageModel {
    constructor() {
        this.selectedLocation = { lat: null, lon: null };
        this.photoFile = null;
        console.log("[AddStoryPageModel] Initialized.");
    }

    async submitStory(data) {
        console.log('[AddStoryPageModel] Calling addNewStory API...');
        return await addNewStory({
            description: data.description,
            photo: this.photoFile,
            lat: this.selectedLocation.lat,
            lon: this.selectedLocation.lon
        });
    }

    setPhotoFile(file) {
        this.photoFile = file;
    }

    clearPhotoFile() {
        this.photoFile = null;
    }

    setLocation(location) {
        this.selectedLocation = location;
    }

    hasPhoto() {
        return !!this.photoFile;
    }

    hasLocation() {
        return this.selectedLocation && 
               typeof this.selectedLocation.lat === 'number' && 
               typeof this.selectedLocation.lon === 'number';
    }
}