function extractPathnameSegments(path) {
  const cleanPath = path.replace(/^\/|\/$/g, '');
  const splitUrl = cleanPath.split('/');

  if (splitUrl.length === 1 && splitUrl[0] === '') {
     return { resource: null, id: null, verb: null };
  }

  return {
     resource: splitUrl[0] || null,
     id: splitUrl[1] || null,
     verb: splitUrl[2] || null,
  };
}

function constructRoutePattern(pathSegments) {
  let route = '/';

  if (pathSegments.resource) {
     route = `/${pathSegments.resource}`;
     if (pathSegments.id && pathSegments.id !== 'add') {
         route += '/:id';
         if (pathSegments.verb) {
             route += `/${pathSegments.verb}`;
         }
     } else if (pathSegments.id) {
         route += `/${pathSegments.id}`;
          if (pathSegments.verb) {
             route += `/${pathSegments.verb}`;
         }
     }
  }
  return route;
}

export function getActivePathname() {
  const hashPath = location.hash.slice(1);
  return hashPath ? (hashPath.startsWith('/') ? hashPath : `/${hashPath}`) : '/';
}

export function getActiveRoute() {
  const pathname = getActivePathname();
  const knownRoutePatterns = ['/', '/login', '/register', '/stories/add', '/about', '/stories/:id', '/offline'];

  const detailMatch = pathname.match(/^\/stories\/([a-zA-Z0-9_-]+)$/);
  if (detailMatch && pathname !== '/stories/add') {
     return '/stories/:id';
  }

  if (knownRoutePatterns.includes(pathname)) {
     return pathname;
  }

  console.warn(`No specific route pattern matched for "${pathname}", returning raw path.`);
  return pathname;
}

export function parseActivePathname() {
  const pathname = getActivePathname();
  return extractPathnameSegments(pathname);
}