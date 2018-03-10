const currentCacheVersion = 'mws-restaurant-v14';
const resourcesToCache = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/css/styles.css',
  '/js/dbhelper.js',
  '/js/main.js',
  '/js/restaurant_info.js',
  '/data/restaurants.json'
  // 'https://normalize-css.googlecode.com/svn/trunk/normalize.css',
  // 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD_S9Z-6zktuRp_GiEL2iTXUAKf_q-p7UY&libraries=places&callback=initMap',
];

// Install SW
self.addEventListener('install', event => {
  // Cache the resources
  // instead of aggressively caching all images, since we have 6 variations of each image, I'd only cache them as they come as requests in the SW's fetch event
  event.waitUntil(
    caches.open(currentCacheVersion).then(cache => {
      return cache.addAll(resourcesToCache);
    })
  );
});

// SW activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      // Delete all other versions of the 'mws-restaurant' cache except for the current one
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (
              cacheName.startsWith('mws-restaurant') &&
              currentCacheVersion != cacheName
            );
          })
          .map(cacheName => {
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
        // Return response from cache if one exists
        if (response) return response;

        // Otherwise hit the network
        return fetch(event.request, { mode: 'no-cors' }).then(netResponse => {
          console.log(netResponse);
          cache.put(event.request.url, netResponse.clone());
          return netResponse;
        });
      });
    })
  );
});
