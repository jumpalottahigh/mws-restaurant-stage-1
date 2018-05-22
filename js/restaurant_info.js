let restaurant;
var map;

/**
 * Load page.
 */
document.addEventListener('DOMContentLoaded', () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
      createStaticMapHTML();
    }
  });
});

/**
 * Initialize Google Maps.
 */
window.initMap = () => {
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false
  });
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);

  // Ally improvements for the map container and the iframe itself
  document
    .querySelector('#map')
    .setAttribute(
      'aria-label',
      `Map with restaurant ${self.restaurant.name}'s location in New York city`
    );
};

/**
 * Add markers for current restaurants to the map.
 */
createStaticMapHTML = () => {
  const staticMapContainer = document.getElementById('static-map-container');
  const mapContainer = document.getElementById('map-container');
  const staticMap = document.createElement('div');
  staticMap.className = 'lazy';
  staticMap.dataset.src = 'staticmap.png';

  // TODO: add responsive images
  // const staticMap = document.createElement('img');
  // staticMap.className = 'lazy';
  // staticMap.dataset.src = 'img/static-map/staticmap_1200.jpg';

  //   <picture>
  //     <source media="(min-width: 1024px)" data-srcset="/your/image1a.jpg" />
  //     <source media="(min-width: 500px)" data-srcset="/your/image1b.jpg" />
  //     <img alt="Stivaletti" data-src="/your/image1.jpg">
  // </picture>

  // TODO: add correct aria label as the image is a background image?
  // staticMap.ariaLabel = 'Google Map of 40.72, -73.98';

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
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }
  const id = getParameterByName('id');
  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-img');

  // Responsive Webp
  const source620Webp = document.createElement('source');
  source620Webp.media = '(min-width: 620px) and (max-width: 980px)';
  source620Webp.srcset = DBHelper.imageUrlForRestaurant(restaurant)
    .split('.jpg')
    .join('_800.webp');

  const sourceWebp = document.createElement('source');
  sourceWebp.srcset = DBHelper.imageUrlForRestaurant(restaurant)
    .split('.jpg')
    .join('.webp');

  // Responsive JPG
  const source620 = document.createElement('source');
  source620.media = '(min-width: 620px) and (max-width: 980px)';
  source620.srcset = DBHelper.imageUrlForRestaurant(restaurant)
    .split('.jpg')
    .join('_800.jpg');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = `Restaurant ${restaurant.name}`;
  image.src = DBHelper.imageUrlForRestaurant(restaurant);

  picture.appendChild(source620Webp);
  picture.appendChild(source620);
  picture.appendChild(sourceWebp);
  picture.appendChild(image);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (
  operatingHours = self.restaurant.operating_hours
) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = review => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = 'highlight';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  rating.className = 'highlight';
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};
