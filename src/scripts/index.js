import '../styles/styles.css';
import App from './pages/app.js';
import './components/story-item.js';
import { isLoggedIn, getUserInfo, logout, EventBus, AUTH_LOGIN_EVENT, AUTH_LOGOUT_EVENT, initImageModal } from './utils/index.js';

let clockIntervalId = null;

document.addEventListener('DOMContentLoaded', () => {
  const mainContentElement = document.querySelector('#main-content');
  const drawerButtonElement = document.querySelector('#drawer-button');
  const navigationDrawerElement = document.querySelector('#navigation-drawer');
  const authMenuContainerElement = document.querySelector('#auth-menu-container');
  const mobileDrawerElement = document.querySelector('#mobile-drawer');
  const mobileAuthContainerElement = document.querySelector('#mobile-auth-menu-container');
  const mobileDrawerCloseButton = document.querySelector('#mobile-drawer-close');
  const drawerOverlayElement = document.querySelector('#drawer-overlay');


  if (!mainContentElement || !drawerButtonElement || !navigationDrawerElement || !authMenuContainerElement || !mobileDrawerElement || !mobileAuthContainerElement || !mobileDrawerCloseButton || !drawerOverlayElement) {
     console.error("Fatal Error: One or more essential layout elements are missing.");
     return;
  }

  initImageModal();
  setupClock();
  setupMobileDrawer(drawerButtonElement, mobileDrawerElement, mobileDrawerCloseButton, drawerOverlayElement);

  const app = new App({
    content: mainContentElement,
    drawerButton: drawerButtonElement,
    navigationDrawer: navigationDrawerElement,
    authMenuContainer: authMenuContainerElement,
  });

  const authLoginListener = (userData) => {
     console.log('EventBus: auth:login received, updating UI...', userData);
     updateAuthUI(authMenuContainerElement, mobileAuthContainerElement);
     updateProtectedNavItems();
  };
  const authLogoutListener = () => {
     console.log('EventBus: auth:logout received, updating UI...');
     updateAuthUI(authMenuContainerElement, mobileAuthContainerElement);
     updateProtectedNavItems();
  };

  EventBus.on(AUTH_LOGIN_EVENT, authLoginListener);
  EventBus.on(AUTH_LOGOUT_EVENT, authLogoutListener);

  const initializeApp = async () => {
    updateAuthUI(authMenuContainerElement, mobileAuthContainerElement);
    updateProtectedNavItems();
    await app.renderPage();
    setupSkipLink();
    window.removeEventListener('hashchange', handleHashChange);
    window.addEventListener('hashchange', handleHashChange);

    if (process.env.NODE_ENV === 'production') {
      const registerServiceWorker = (await import('./utils/sw-register.js')).default;
      await registerServiceWorker();
    } else {
      console.log('Development mode: Service Worker registration skipped.');
    }
  };

  const handleHashChange = async () => {
    console.log('Hash changed:', location.hash);
    closeMobileDrawer(mobileDrawerElement, drawerOverlayElement, drawerButtonElement);
    await app.renderPage();
    window.scrollTo(0, 0);
  };

  initializeApp();
});

function setupClock() {
  const timeEl = document.querySelector('.clock__time');
  const dateEl = document.querySelector('.clock__date');

  function updateClock() {
     if (!timeEl || !dateEl) return;
     const now = new Date();
     const hours = String(now.getHours()).padStart(2, '0');
     const minutes = String(now.getMinutes()).padStart(2, '0');
     const seconds = String(now.getSeconds()).padStart(2, '0');
     timeEl.textContent = `${hours}:${minutes}:${seconds}`;

     const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
     try {
       dateEl.textContent = now.toLocaleDateString('id-ID', options);
     } catch (e) {
       dateEl.textContent = now.toLocaleDateString('en-US', options);
     }
  }

  if (clockIntervalId) {
    clearInterval(clockIntervalId);
  }
  updateClock();
  clockIntervalId = setInterval(updateClock, 1000);
}

function setupMobileDrawer(button, drawer, closeButton, overlay) {
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        openMobileDrawer(drawer, overlay, button);
    });
    closeButton.addEventListener('click', () => {
        closeMobileDrawer(drawer, overlay, button);
    });
    overlay.addEventListener('click', () => {
        closeMobileDrawer(drawer, overlay, button);
    });
    drawer.addEventListener('click', (e) => {
       if (e.target.matches('a')) {
          closeMobileDrawer(drawer, overlay, button);
       }
    });
}

function openMobileDrawer(drawer, overlay, button) {
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    button.setAttribute('aria-expanded', 'true');
    drawer.classList.add('open');
    overlay.classList.add('open');
}

function closeMobileDrawer(drawer, overlay, button) {
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('open');
    overlay.classList.remove('open');
}

function updateAuthUI(desktopContainer, mobileContainer) {
    if (!desktopContainer || !mobileContainer) { return; }
    desktopContainer.innerHTML = '';
    mobileContainer.innerHTML = '';

    let desktopContent = '';
    let mobileContent = '';

    if (isLoggedIn()) {
        const userInfo = getUserInfo();
        const userName = userInfo ? userInfo.name : 'User';

        desktopContent = `
            <li><span class="user-greeting">Hi, <strong>${userName}</strong>!</span></li>
            <li><button id="logout-button-desktop" class="nav-button button--logout"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
        `;
        mobileContent = `
            <li><span class="user-greeting--mobile">Hi, <strong>${userName}</strong>!</span></li>
            <li><button id="logout-button-mobile" class="nav-button button--logout"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
        `;
    } else {
        desktopContent = `<li><a href="#/login" class="button button--outline button--sm">Login</a></li>`;
        mobileContent = `<li><a href="#/login">Login</a></li><li><a href="#/register">Register</a></li>`;
    }

    desktopContainer.innerHTML = desktopContent;
    mobileContainer.innerHTML = mobileContent;

    if (isLoggedIn()) {
        const logoutHandler = (e) => {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin logout?')) {
                logout();
            }
        };
        document.getElementById('logout-button-desktop')?.addEventListener('click', logoutHandler);
        document.getElementById('logout-button-mobile')?.addEventListener('click', logoutHandler);
    }
    console.log("Auth UI updated for desktop and mobile.");
}

function updateProtectedNavItems() {
    const protectedItems = document.querySelectorAll('.nav-item--auth-required');
    const loggedIn = isLoggedIn();
    protectedItems.forEach(item => {
        item.style.display = loggedIn ? '' : 'none';
    });
     console.log("Protected nav items visibility updated.");
}

function setupSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    const mainContent = document.querySelector('#main-content');
    if (skipLink && mainContent) {
        skipLink.removeEventListener('click', handleSkipLinkClick);
        skipLink.addEventListener('click', handleSkipLinkClick);
    }
}

function handleSkipLinkClick(event) {
    event.preventDefault();
    const mainContent = document.querySelector('#main-content');
    if (mainContent) {
        mainContent.focus();
    }
}