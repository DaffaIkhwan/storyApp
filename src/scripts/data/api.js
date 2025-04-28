import CONFIG from '../config.js';
import { getAuthToken } from '../utils/auth-utils.js';

const API_ENDPOINT = CONFIG.BASE_URL;
const FETCH_TIMEOUT = 15000;

const ENDPOINTS = {
  REGISTER: `${API_ENDPOINT}/register`,
  LOGIN: `${API_ENDPOINT}/login`,
  GET_STORIES: `${API_ENDPOINT}/stories`,
  ADD_STORY: `${API_ENDPOINT}/stories`,
  GET_STORY_DETAIL: (id) => `${API_ENDPOINT}/stories/${id}`,
  SUBSCRIBE_NOTIFICATION: `${API_ENDPOINT}/notifications/subscribe`,
};

async function fetchAPI(url, options = {}) {
  console.log(`[API] Requesting: ${options.method || 'GET'} ${url}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[API] Request timeout triggered for ${url} after ${FETCH_TIMEOUT}ms`);
    controller.abort();
  }, FETCH_TIMEOUT);

  let response;
  try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 204) {
        console.log(`[API] Success (204 No Content): ${options.method || 'GET'} ${url}`);
        return { error: false, message: 'Operasi berhasil.' };
      }
      let responseData;
      try {
        responseData = await response.json();
      } catch (jsonError) {
        if (!response.ok) {
          console.error(`[API] Failed to parse JSON for non-OK response (${response.status}) from ${url}:`, jsonError);
          let errorText = await response.text().catch(() => `Server error ${response.status}`);
          throw new Error(`Server error (${response.status}): ${errorText.substring(0, 100)}`);
        }
        console.warn(`[API] Could not parse JSON response from ${url} (Status: ${response.status}):`, jsonError);
        responseData = { error: false, message: 'Respons sukses namun body kosong atau tidak valid.', data: null };
      }

      if (!response.ok) {
        const apiMessage = responseData?.message || response.statusText;
        const statusCode = response.status;
        console.error(`[API] Error Response (${statusCode}) from ${url}:`, apiMessage, responseData);
        let userMessage = apiMessage || `Terjadi kesalahan (${statusCode})`;
        if (statusCode >= 500) { userMessage = `Terjadi masalah pada server (${statusCode}). Mohon coba beberapa saat lagi.`; }
        else if (statusCode === 401) { userMessage = 'Akses ditolak (401). Sesi Anda mungkin berakhir, silakan login kembali.'; }
        else if (statusCode === 400) { userMessage = `Input tidak valid: ${apiMessage}`; }
        else if (statusCode === 404) { userMessage = `Sumber tidak ditemukan (${statusCode}).`; }
        else if (statusCode === 413) { userMessage = `Ukuran file terlalu besar (${statusCode}). Pastikan gambar tidak melebihi 1MB.`; }
        throw new Error(userMessage);
      }
      if (responseData?.error === true) {
        console.error(`[API] Logic Error in response from ${url}:`, responseData.message, responseData);
        throw new Error(responseData.message || 'Terjadi kesalahan pada server.');
      }
      console.log(`[API] Success: ${options.method || 'GET'} ${url}`);
      return responseData;

  } catch (error) {
    clearTimeout(timeoutId);

    console.error(`[API] Fetch failed for ${url}:`, error);
    let userMessage = `Terjadi kesalahan: ${error.message}`;

    if (error.name === 'AbortError') {
      userMessage = 'Permintaan ke server terlalu lama. Periksa koneksi Anda dan coba lagi.';
    }
    else if (error instanceof TypeError && error.message.includes('fetch')) {
      userMessage = 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    } else if (error.message.includes('Akses ditolak') || error.message.includes('Input tidak valid') || error.message.includes('Server error') || error.message.includes('Ukuran file')) {
      userMessage = error.message;
    }
    throw new Error(userMessage);
  }
}

async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  const isPublicEndpoint = url.includes('/login') || url.includes('/register');
  if (!token && !isPublicEndpoint) {
    console.error(`[API] Auth Error: Accessing protected endpoint ${url} without token.`);
    throw new Error('Autentikasi diperlukan. Silakan login terlebih dahulu.');
  }
  const defaultHeaders = { 'Authorization': token ? `Bearer ${token}` : '' };
  if (!(options.body instanceof FormData)) { defaultHeaders['Content-Type'] = 'application/json'; }
  return fetchAPI(url, { ...options, headers: { ...defaultHeaders, ...options.headers } });
}

export async function register({ name, email, password }) {
  return fetchAPI(ENDPOINTS.REGISTER, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) });
}
export async function login({ email, password }) {
  const responseData = await fetchAPI(ENDPOINTS.LOGIN, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!responseData || !responseData.loginResult) {
      console.error("[API] Login response missing 'loginResult'. Response:", responseData);
      throw new Error("Format respons login tidak valid dari server.");
  }
  return responseData.loginResult;
}
export async function getAllStories({ page = 1, size = 10, location = 0 } = {}) {
    const queryParams = new URLSearchParams({ page, size, location }).toString();
    return fetchWithAuth(`${ENDPOINTS.GET_STORIES}?${queryParams}`);
}
export async function getStoryDetail(id) {
    if (!id) {
        console.error("[API] getStoryDetail called without an ID.");
        throw new Error("ID cerita diperlukan untuk mengambil detail.");
    }
    return fetchWithAuth(ENDPOINTS.GET_STORY_DETAIL(id));
}
export async function addNewStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  const isValidCoordinate = (coord) => typeof coord === 'number' && !isNaN(coord);
  if (isValidCoordinate(lat) && isValidCoordinate(lon)) { formData.append('lat', lat); formData.append('lon', lon); }
  return fetchWithAuth(ENDPOINTS.ADD_STORY, { method: 'POST', body: formData });
}

export async function subscribePushNotification({ endpoint, keys }) {
  return fetchWithAuth(ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
    method: 'POST',
    body: JSON.stringify({
      endpoint,
      keys: {
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    }),
  });
}

export async function unsubscribePushNotification(endpoint) {
  return fetchWithAuth(ENDPOINTS.SUBSCRIBE_NOTIFICATION, {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  });

  
}

