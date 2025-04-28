import EventBus, { AUTH_LOGIN_EVENT, AUTH_LOGOUT_EVENT } from './event-bus.js';

const AUTH_TOKEN_KEY = 'dicoding_story_auth_token';
const USER_INFO_KEY = 'dicoding_story_user_info';

export function saveAuthToken(token) {
  if (!token) {
      console.warn("Attempted to save null or undefined token.");
      return;
  }
  try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      console.log("Auth token saved.");
  } catch (error) {
      console.error("Failed to save auth token to localStorage:", error);
  }
}

export function getAuthToken() {
  try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
      console.error("Failed to get auth token from localStorage:", error);
      return null;
  }
}

export function removeAuthToken() {
  try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      console.log("Auth token removed.");
  } catch (error) {
      console.error("Failed to remove auth token from localStorage:", error);
  }
}

export function saveUserInfo(userInfo) {
    if (!userInfo || typeof userInfo !== 'object' || !userInfo.userId || !userInfo.name) {
        console.warn("Attempted to save invalid user info:", userInfo);
        return;
    }
    try {
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
        console.log("User info saved:", userInfo);
        EventBus.dispatch(AUTH_LOGIN_EVENT, { ...userInfo });
    } catch (error) {
        console.error("Failed to save user info to localStorage:", error);
    }
}

export function getUserInfo() {
    try {
        const info = localStorage.getItem(USER_INFO_KEY);
        if (!info) return null;
        try {
            return JSON.parse(info);
        } catch (parseError){
           console.error("Failed to parse user info from localStorage:", parseError, "Stored value:", info);
           removeUserInfo();
           return null;
        }
    } catch (error) {
        console.error("Failed to get user info from localStorage:", error);
        return null;
    }
}

export function removeUserInfo() {
    try {
        localStorage.removeItem(USER_INFO_KEY);
        console.log("User info removed.");
    } catch (error) {
        console.error("Failed to remove user info from localStorage:", error);
    }
}

export function isLoggedIn() {
  const token = getAuthToken();
  return !!token;
}

export function logout() {
  console.log("Logging out user...");
  const userInfo = getUserInfo();
  removeAuthToken();
  removeUserInfo();

  EventBus.dispatch(AUTH_LOGOUT_EVENT, { lastUser: userInfo });

  location.hash = '#/login';
  console.log("Redirecting to #/login after logout.");
}