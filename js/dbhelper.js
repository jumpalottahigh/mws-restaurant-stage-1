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
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Get IDB promise.
   */
  static dbPromise() {
    // If we don't have SW support we have little use for the IDB
    if (!navigator.serviceWorker) return;

    return idb.open('restaurantReviewsApp', 1, upgradeDb => {
      const store = upgradeDb.createObjectStore('restaurants', {
        keyPath: 'id'
      });
    });
  }

  /**
   * Get data from IDB.
   */
  static getDataFromIDB() {
    return DBHelper.dbPromise().then(db => {
      const index = db.transaction('restaurants').objectStore('restaurants');
      return index.getAll();
    });
  }

  /**
   * Get data from API.
   */
  static getDataFromAPI() {
    const APIrequest = fetch(DBHelper.DATABASE_URL)
      .then(response => response.json())
      .catch(error => {
        throw new Error(`Could not fetch restaurants: ${error.status}`);
      });

    return APIrequest.then(restaurants => {
      // Write items to IDB for next visit
      DBHelper.dbPromise().then(db => {
        if (!db) return;

        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');

        restaurants.forEach(message => {
          store.put(message);
        });
      });
      return restaurants;
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    return DBHelper.getDataFromIDB().then(restaurantsFromIDB => {
      if (restaurantsFromIDB.length) {
        console.log(`FROM IDB: ${restaurantsFromIDB}`);
        return restaurantsFromIDB;
      } else {
        // Make an API request and parse the data as JSON
        return DBHelper.getDataFromAPI().then(restaurantsFromAPI => {
          console.log(`FROM API: ${restaurantsFromAPI}`);
          return restaurantsFromAPI;
        });
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants().then((error, restaurants) => {
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
    DBHelper.fetchRestaurants().then((error, restaurants) => {
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
    DBHelper.fetchRestaurants().then((error, restaurants) => {
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
    DBHelper.fetchRestaurants().then((restaurants, error) => {
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
    return DBHelper.fetchRestaurants().then((error, restaurants) => {
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
        console.log(uniqueNeighborhoods);
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
    DBHelper.fetchRestaurants().then((error, restaurants) => {
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
}
