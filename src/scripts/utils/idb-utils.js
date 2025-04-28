import { openDB } from 'idb';

const DATABASE_NAME = 'storyapp-db';
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = 'offline-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    console.log(`Upgrading database from version ${database.oldVersion} to ${DATABASE_VERSION}`);
    if (!database.objectStoreNames.contains(OBJECT_STORE_NAME)) {
       database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
       console.log(`Object store "${OBJECT_STORE_NAME}" created.`);
    }
  },
});

export const saveStoryForOffline = async (story) => {
  if (!story || !story.id) {
    console.error('Invalid story data provided to saveStoryForOffline:', story);
    return;
  }
  try {
    // Convert image URL to Blob
    const imageBlob = await urlToBlob(story.photoUrl);
    
    // Create modified story object with Blob
    const storyToSave = {
      ...story,
      photoBlob: imageBlob,
      photoUrl: story.photoUrl // tetap simpan URL asli
    };

    const db = await dbPromise;
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.put(storyToSave);
    await tx.done;
    console.log(`Story with id ${story.id} saved/updated for offline.`);
  } catch (error) {
    console.error(`Failed to save story ${story.id} for offline:`, error);
    throw error;
  }
};

const urlToBlob = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Failed to convert URL to Blob:', error);
    return null;
  }
};

export const getAllOfflineStories = async () => {
  try {
    const db = await dbPromise;
    const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    const stories = await store.getAll();
    await tx.done;
    console.log(`Retrieved ${stories.length} stories from offline store.`);
    return stories;
  } catch (error) {
    console.error('Failed to get all offline stories:', error);
    return [];
  }
};

export const getOfflineStoryById = async (id) => {
   if (!id) return null;
   try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, 'readonly');
      const store = tx.objectStore(OBJECT_STORE_NAME);
      const story = await store.get(id);
      await tx.done;
      console.log(`Retrieved offline story by id ${id}:`, story ? 'found' : 'not found');
      return story;
   } catch (error) {
      console.error(`Failed to get offline story by id ${id}:`, error);
      return null;
   }
}

export const deleteOfflineStory = async (id) => {
  if (!id) {
    console.error('Invalid id provided to deleteOfflineStory');
    return;
  }
  try {
    const db = await dbPromise;
    const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
    const store = tx.objectStore(OBJECT_STORE_NAME);
    await store.delete(id);
    await tx.done;
    console.log(`Story with id ${id} deleted from offline store.`);
  } catch (error) {
    console.error(`Failed to delete story ${id} from offline store:`, error);
    throw error;
  }
};