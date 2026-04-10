const public_latitude = document.getElementById('public_latitude');
const public_longitude = document.getElementById('public_longitude');
const public_polygon = document.getElementById('public_forecast_zone');

// /**
//  * 
//  * @param {Array} arr 
//  * @param {Function} add_this_area_to_map 
//  */
// function reverse_array(arr_outside, add_this_area_to_map) {
//     for(let i = 0; i < arr_outside.length; i++){
//         for(let j = 0; j < arr_outside[i].length; j++) {
//             const p = arr_outside[i][j];
//             const c = p[0];
//             p[0] = p[1];
//             p[1] = c;
//         }
//         add_this_area_to_map(arr_outside[i])
//         console.log(`area${i}: `, arr_outside[i][0])
//     }
// }
function render_polygon_to_map(polygon_info, render_function = (arr) => {console.log(arr)}) {
    const polygon = polygon_info.polygon;
    const type = polygon_info.poly_type;

    function _reverse_array(arr_outside) {
        for(let i = 0; i < arr_outside.length; i++){
            for(let j = 0; j < arr_outside[i][0].length; j++) {
                const p = arr_outside[i][0][j];
                const c = p[0];
                p[0] = p[1];
                p[1] = c;
            }
            console.log(`area${i}: `, arr_outside[i][0]);
            render_function(arr_outside[i][0])
        }
    }
    
    switch(type) {
        case "MultiPolygon":
            _reverse_array(polygon)
            break;
        case "Polygon":
            _reverse_array([polygon])
            break;
        default:
            console.error('wrong type: ', type)
    }
}

document.getElementById('to_listen_event_to_know_it_loaded').addEventListener('click', () => {
    const lat = parseFloat(public_latitude.value);
    const lng = parseFloat(public_longitude.value);
    const polygon_info = JSON.parse(public_polygon.value);

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

    render_polygon_to_map(polygon_info, (arr) => {
        var polyg = L.polygon(arr, {color: '#0c2355', fillColor: '#b5ccff',}).addTo(map)
    });
    // reverse_array(polygon_arr, (arr) => {
    //     var polyg = L.polygon(arr).addTo(map)
    // });

    
})

