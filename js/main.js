let restaurants, neighborhoods, cuisines;
var map;
var markers = [];

var myLazyLoad = new LazyLoad({
  elements_selector: 'img, .lazy'
});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
  createStaticMapHTML();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(
    cuisine,
    neighborhood,
    (error, restaurants) => {
      if (error) {
        // Got an error!
        console.error(error);
      } else {
        resetRestaurants(restaurants);
        fillRestaurantsHTML();
        myLazyLoad.update();
      }
    }
  );
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const favoriteContainer = document.createElement('div');
  favoriteContainer.style.textAlign = 'right';
  const favorite = document.createElement('span');
  favorite.style.transition = '475ms';
  favorite.setAttribute('role', 'img');
  favorite.setAttribute('aria-label', 'heart emoji');

  // Set is_favorite by default to false if non existent
  if (restaurant.is_favorite == null || restaurant.is_favorite == undefined) {
    restaurant.is_favorite = false;
  }

  favorite.dataset.liked = restaurant.is_favorite;

  if (favorite.dataset.liked == 'true') {
    favorite.innerText = '💜';
  } else {
    favorite.innerText = '🖤';
    favorite.style.opacity = '0.7';
  }

  favorite.addEventListener('click', e => {
    // Update the UI
    if (e.target.dataset.liked == 'false') {
      e.target.dataset.liked = true;
      e.target.innerText = '💜';
      e.target.style.opacity = '1';
      e.target.parentNode.parentNode.classList.add('liked');
    } else {
      e.target.dataset.liked = false;
      e.target.innerText = '🖤';
      e.target.style.opacity = '0.7';
      e.target.parentNode.parentNode.classList.remove('liked');
    }

    restaurant.is_favorite = e.target.dataset.liked;

    // Update the API and IDB
    DBHelper.favoriteRestaurant(restaurant);
  });

  favoriteContainer.append(favorite);
  li.append(favoriteContainer);

  // Create picture tag to wrap responsive image sources
  const picture = document.createElement('picture');

  // Responsive Webp for Chrome
  const source700Webp = document.createElement('source');
  source700Webp.media = '(min-width: 700px) and (max-width: 1380px)';
  source700Webp.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant)
    .split('.jpg')
    .join('_400.webp');

  const sourceWebp = document.createElement('source');
  sourceWebp.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant)
    .split('.jpg')
    .join('.webp');

  // Responsive JPG
  const source700 = document.createElement('source');
  source700.media = '(min-width: 700px) and (max-width: 1380px)';
  source700.dataset.srcset = DBHelper.imageUrlForRestaurant(restaurant)
    .split('.jpg')
    .join('_400.jpg');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.dataset.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Restaurant ${restaurant.name}`;
  picture.append(source700Webp);
  picture.append(source700);
  picture.append(sourceWebp);
  picture.append(image);
  li.append(picture);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more);

  return li;
};

/**
 * Add markers for current restaurants to the map.
 */
createStaticMapHTML = () => {
  const staticMapContainer = document.getElementById('static-map-container');
  const mapContainer = document.getElementById('map-container');
  const staticMap = document.createElement('div');
  staticMap.className = 'static-map';

  const picture = document.createElement('picture');
  picture.style.display = 'flex';
  picture.style.flexGrow = 1;
  picture.style.justifySelf = 'center';
  picture.style.position = 'absolute';
  picture.style.maxWidth = '100%';

  const source600 = document.createElement('source');
  source600.media = '(min-width: 600px) and (max-width: 799px)';
  source600.dataset.srcset = 'img/static-map/staticmap_600.jpg';

  const source800 = document.createElement('source');
  source800.media = '(min-width: 800px) and (max-width: 1199px)';
  source800.dataset.srcset = 'img/static-map/staticmap_800.jpg';

  const source1200 = document.createElement('source');
  source1200.media = '(min-width: 1200px)';
  source1200.dataset.srcset = 'img/static-map/staticmap_1200.jpg';

  const image = document.createElement('img');
  image.dataset.src = 'img/static-map/staticmap_400.jpg';
  image.alt = 'Map with restaurants';
  image.style.width = '100%';

  picture.append(source1200);
  picture.append(source800);
  picture.append(source600);
  picture.append(image);
  staticMap.append(picture);

  // Backdrop to highlight button better
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';

  // button on top of static map to denote interactivity
  const button = document.createElement('button');
  button.className = 'button';
  button.innerText = 'Show on map';

  // Click event listener to load map on demand
  button.addEventListener('click', () => {
    window.initMap();
    staticMapContainer.style.display = 'none';
    mapContainer.style.display = 'block';
  });

  staticMap.append(button);
  staticMapContainer.append(backdrop);
  staticMapContainer.append(staticMap);
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url;
    });
    self.markers.push(marker);
  });
};

/**
 * Add title attribute to the map iframe.
 */
window.addEventListener('load', () => {
  // Update lazy loaded images
  myLazyLoad.update();

  const iframe = document.querySelector('iframe');
  if (!iframe) return;
  iframe.setAttribute('title', 'map of restaurants');
});
