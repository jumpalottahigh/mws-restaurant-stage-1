/**
 * Register ServiceWorker.
 */
if ('serviceWorker' in navigator) {
  // Defer service worker registration until after the page has been completely loaded
  // as seen here: https://developers.google.com/web/fundamentals/primers/service-workers/registration
  window.addEventListener('load', function() {
    navigator.serviceWorker
      .register('sw.js')
      .then(() => console.log('SW is registered!'));
  });
}

/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Open IDB.
   */
  static openIDB() {
    return idb.open('restaurantReviewsApp', 1, upgradeDb => {
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        const store = upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
      }

      if (!upgradeDb.objectStoreNames.contains('pending-reviews')) {
        const store = upgradeDb.createObjectStore('pending-reviews', {
          keyPath: 'id',
          autoIncrement: true
        });
      }

      for (let i = 1; i < 10; i++) {
        if (!upgradeDb.objectStoreNames.contains(`reviews-restaurant-${i}`)) {
          const store = upgradeDb.createObjectStore(`reviews-restaurant-${i}`, {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      }
    });
  }

  /**
   * Delete store in IDB.
   */
  static deleteInIDB(transactionName, storeName) {
    return DBHelper.openIDB().then(db => {
      const tx = db
        .transaction(transactionName, 'readwrite')
        .objectStore(storeName)
        .clear();
      return tx.complete;
    });
  }

  /**
   * Load from IDB.
   */
  static loadFromIDB(transactionName, storeName) {
    return DBHelper.openIDB().then(db => {
      const index = db.transaction(transactionName).objectStore(storeName);
      return index.getAll();
    });
  }

  /**
   * Save to IDB.
   */
  static saveToIDB(data, transactionName, storeName) {
    return DBHelper.openIDB().then(db => {
      if (!db) return;

      const tx = db.transaction(transactionName, 'readwrite');
      const store = tx.objectStore(storeName);

      Array.from(data).forEach(bit => store.put(bit));

      return tx.complete;
    });
  }

  /**
   * Save to IDB.
   */
  static saveReviewToIDB(data, transactionName, storeName) {
    return DBHelper.openIDB().then(db => {
      if (!db) return;

      const tx = db.transaction(transactionName, 'readwrite');
      const store = tx.objectStore(storeName);

      store.put(data);

      return tx.complete;
    });
  }

  /**
   * Get data from API.
   */
  static loadFromAPI(slug) {
    return fetch(`${DBHelper.DATABASE_URL}/${slug}`)
      .then(response => response.json())
      .then(data => {
        // Write items to IDB for next visit
        DBHelper.saveToIDB(data, slug, slug);
        return data;
      });
  }

  /**
   * Get reviews data from API.
   */
  static loadReviewsFromAPI(slug) {
    return fetch(`${DBHelper.DATABASE_URL}/${slug}`)
      .then(response => response.json())
      .then(data => {
        // Write items to IDB for next visit
        DBHelper.saveToIDB(
          data,
          `reviews-restaurant-${self.restaurant.id}`,
          `reviews-restaurant-${self.restaurant.id}`
        );
        console.log(
          `Reviews data from API for restaurant: ${self.restaurant.id}`
        );
        console.log(data);
        return data;
      });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    DBHelper.loadFromIDB('restaurants', 'restaurants')
      .then(data => {
        if (data.length == 0) {
          // Make an API request
          return DBHelper.loadFromAPI('restaurants');
        }
        console.log(`FROM IDB: ${data}`);
        return data;
      })
      .then(restaurants => {
        callback(null, restaurants);
      })
      .catch(error => {
        console.log(`Something is wrong: ${error}`);
        callback(error, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    callback
  ) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map(
          (v, i) => restaurants[i].neighborhood
        );
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter(
          (v, i) => neighborhoods.indexOf(v) == i
        );
        // return uniqueNeighborhoods;
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter(
          (v, i) => cuisines.indexOf(v) == i
        );
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    let { photograph } = restaurant;

    if (!photograph) {
      // Currently the API does not return an image for restaurant 10, so let's fix it
      photograph = 10;
    }

    return `/img/${photograph}.jpg`;
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP
    });
    return marker;
  }

  /**
   * Handle favorite restaurant, post to API and save in IDB
   */
  static favoriteRestaurant(restaurant) {
    if (!restaurant) return;

    return fetch(
      `${DBHelper.DATABASE_URL}/restaurants/${restaurant.id}/?is_favorite=${
        restaurant.is_favorite
      }`,
      {
        method: 'PUT'
      }
    )
      .then(response => response.json())
      .then(data => {
        DBHelper.saveToIDB(self.restaurants, 'restaurants', 'restaurants');
        return data;
      })
      .catch(e => console.error(`${e}: Could not update.`));
  }

  /**
   * Fetch all restaurant reviews
   */
  static fetchReviewsById(id, callback) {
    DBHelper.loadFromIDB(`reviews-restaurant-${id}`, `reviews-restaurant-${id}`)
      .then(data => {
        if (data.length == 0) {
          return DBHelper.loadReviewsFromAPI(`reviews/?restaurant_id=${id}`);
        }
        return Promise.resolve(data);
      })
      .then(reviews => {
        callback(null, reviews);
      })
      .catch(err => {
        console.log(`ERROR DB: ${err.status}`);
        callback(err, null);
      });
  }

  /**
   * Post new review to API
   */
  static postToAPI(review) {
    if (!review) return;

    return fetch(`${DBHelper.DATABASE_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify(review),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(resp => resp.json())
      .then(data => {
        // save to IDB
        DBHelper.saveReviewToIDB(
          data,
          `reviews-restaurant-${self.restaurant.id}`,
          `reviews-restaurant-${self.restaurant.id}`
        );
        return data;
      })
      .catch(err => {
        // Save a pending review in IDB
        DBHelper.saveReviewToIDB(review, `pending-reviews`, `pending-reviews`);
        // Add it as a global too
        if (!self.pendingReviews) {
          self.pendingReviews = [];
        }
        self.pendingReviews.push(review);

        console.log(`Error: ${err}`);
        return review;
      });
  }
}
