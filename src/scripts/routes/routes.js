import HomePage from '../pages/home/home-page.js';
import LoginPage from '../pages/auth/login-page.js';
import RegisterPage from '../pages/auth/register-page.js';
import AddStoryPage from '../pages/stories/add-story-page.js';
import DetailStoryPage from '../pages/stories/detail-story-page.js';
import OfflinePage from '../pages/offline/offline-page.js';

const routes = {
  '/': new HomePage(),
  '/login': new LoginPage(),
  '/register': new RegisterPage(),
  '/stories/add': new AddStoryPage(),
  '/offline': new OfflinePage(),
  '/stories/:id': new DetailStoryPage(),
};

export default routes;