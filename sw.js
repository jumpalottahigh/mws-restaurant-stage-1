const currentCacheVersion = 'mws-restaurant-v4';

// Install SW
self.addEventListener('install', event => {
  // TODO: add images to this lists
  const resourcesToCache = [
    '/',
    '/index.html',
    'restaurant.html',
    'css/styles.css',
    'https://normalize-css.googlecode.com/svn/trunk/normalize.css',
    'js/dbhelper.js',
    'js/main.js',
    'js/restaurant_info.js',
    'https://maps.googleapis.com/maps/api/js?key=AIzaSyD_S9Z-6zktuRp_GiEL2iTXUAKf_q-p7UY&libraries=places&callback=initMap',
    'data/restaurants.json'
  ];

  // Cache the resources
  event.waitUntil(
    caches.open(currentCacheVersion).then(cache => {
      return cache.addAll(resourcesToCache);
    })
  );
});

// SW activate
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return (
              cacheName.startsWith('mws-restaurant') &&
              cacheName != currentCacheVersion
            );
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

// SW Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(currentCacheVersion).then(cache => {
      return cache.match(event.request).then(response => {
        // Return response from cache if one exists, otherwise go to network
        return (
          response ||
          fetch(event.request, { mode: 'no-cors' }).then(response => {
            cache.put(event.request, response.close());
            return response;
          })
        );
        // if (response) return response
        // return fetch(event.request)
      });
    })
  );
});
