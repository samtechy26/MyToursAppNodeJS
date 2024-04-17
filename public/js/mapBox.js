export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2FtbXl0ZWNoIiwiYSI6ImNsdjI0cndlMDA2Mm4ybG11aWVyaTFscGkifQ.IoxhkshOZ5BciTegyD-yhA';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/sammytech/clv25h0i100ay01qzborsbgwr',
    //   center: [-118.2503, 34.030973],
    //   zoom: 10,
    //   interactive: false,
  });

  map.scrollZoom.disable();

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // create marker
    const el = document.createElement('div');
    el.className = 'marker';
    // add marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Add pop
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // extend the map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  // Ensure that the map fits all the markers
  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
