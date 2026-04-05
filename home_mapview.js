const public_latitude = document.getElementById('public_latitude');
const public_longitude = document.getElementById('public_longitude');

document.getElementById('to_listen_event_to_know_it_loaded').addEventListener('click', () => {
    const lat = parseFloat(public_latitude.value);
    const lng = parseFloat(public_longitude.value);

    var map = L.map('small_map_container').setView([lat, lng], 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    var circle = L.circle([lat, lng], {
        color: '#39538b',
        fillColor: '#b5ccff',
        fillOpacity: 0.5,
        radius: 3000
    }).addTo(map);
    circle.bindPopup("This represents the approximate location derived from the coordinates.");
})

