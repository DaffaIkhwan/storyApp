import routes from '../routes/routes.js';
import { getActiveRoute, getActivePathname } from '../routes/url-parser.js';
import { isLoggedIn } from '../utils/auth-utils.js';
import { setContentBusy } from '../utils/ui-utils.js';

class App {
  _content = null;
  _drawerButton = null;
  _navigationDrawer = null;

  constructor({ content, drawerButton, navigationDrawer, authMenuContainer }) {
    if (!content || !drawerButton || !navigationDrawer || !authMenuContainer) {
        throw new Error('App requires content, drawerButton, navigationDrawer, and authMenuContainer elements.');
    }
    this._content = content;
    this._drawerButton = drawerButton;
    this._navigationDrawer = navigationDrawer;
  }

  async renderPage() {
    const currentPath = getActivePathname();
    const targetRoute = getActiveRoute();
    const page = routes[targetRoute];
    console.log(`[App] Rendering page for path: ${currentPath}, route pattern: ${targetRoute}`);
    const protectedRoutes = ['/', '/stories/add'];
    const publicOnlyRoutes = ['/login', '/register'];
    const userIsLoggedIn = isLoggedIn();

    if (!userIsLoggedIn && protectedRoutes.includes(currentPath)) {
        console.warn(`[App] Access denied. Redirecting to /login.`);
        location.hash = '#/login';
        setContentBusy(this._content, true, 'Redirecting to login...');
        document.title = 'Redirecting...'; // Biarkan untuk redirect
        return;
     }
     if (userIsLoggedIn && publicOnlyRoutes.includes(currentPath)) {
        console.warn(`[App] Already logged in. Redirecting to /. `);
        location.hash = '#/';
        setContentBusy(this._content, true, 'Redirecting to home...');
        document.title = 'Redirecting...'; // Biarkan untuk redirect
        return;
     }

    if (!page) {
      console.error(`[App] Route object not found for pattern ${targetRoute}`);
      this._content.innerHTML = `
          <section class="container" style="text-align: center; padding-top: 50px;">
            <h1 id="page-heading" tabindex="-1">404 - Halaman Tidak Ditemukan</h1>
            <p>Maaf, halaman di alamat <code style="background: #eee; padding: 2px 4px; border-radius: 3px;">${currentPath}</code> tidak terdaftar.</p>
            <a href="#/" class="button" style="margin-top: 20px;">Kembali ke Beranda</a>
          </section>`;
      document.title = '404 - Not Found'; // Set judul untuk 404
      const heading404 = document.getElementById('page-heading');
      if(heading404) heading404.focus();
      return;
    }

    try {
      // const pageTitle = (typeof page.title === 'string' && page.title) ? page.title : 'Dicoding Story App'; // Tidak perlu ambil title awal lagi
      if (document.startViewTransition) {
        document.startViewTransition(async () => {
          setContentBusy(this._content, true, 'Memuat halaman...');
          this._content.innerHTML = await page.render();
          setContentBusy(this._content, false);
          await page.afterRender(); // Biarkan afterRender yang set judul final
          if (typeof page.attachCleanupListener === 'function') {
            page.attachCleanupListener();
          }
          this._content.focus({ preventScroll: true });
          // document.title = pageTitle; // <-- HAPUS BARIS INI
          console.log(`[App] Page rendered successfully with transition.`); // Pesan log disesuaikan
        });
      } else {
        setContentBusy(this._content, true, 'Memuat halaman...');
        this._content.innerHTML = await page.render();
        setContentBusy(this._content, false);
        await page.afterRender(); // Biarkan afterRender yang set judul final
         if (typeof page.attachCleanupListener === 'function') {
           page.attachCleanupListener();
         }
        this._content.focus({ preventScroll: true });
        // document.title = pageTitle; // <-- HAPUS BARIS INI
        console.log(`[App] Page rendered successfully (no transition).`); // Pesan log disesuaikan
      }
    } catch (error) {
        console.error(`[App] Error rendering page "${page?.constructor?.name || targetRoute}":`, error);
        setContentBusy(this._content, false);
        this._content.innerHTML = `
            <section class="container" style="text-align: center; padding-top: 50px;">
              <h1 id="page-heading" tabindex="-1">Oops! Terjadi Kesalahan</h1>
              <p>Maaf, terjadi masalah saat mencoba menampilkan halaman ini. Silakan coba lagi nanti.</p>
              <p class="error-message" style="margin-top: 10px; font-size: 0.85rem; background: #eee; padding: 5px; border-radius: 3px; display: inline-block;">Detail Error: ${error.message}</p>
              <br><a href="#/" class="button" style="margin-top: 20px;">Kembali ke Beranda</a>
            </section>`;
        document.title = 'Error - Dicoding Story App'; // Set judul untuk error
        const errorHeading = document.getElementById('page-heading');
        if(errorHeading) errorHeading.focus();
    }
  }
}
export default App;