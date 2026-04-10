import { 
    url_param,
    get_content,
    get_current_location,
    get_current_temperature,
    convert_deg_dir,
    convert_meter_to_ft_or_miles,
    to12Hour,
    c_to_f,
    Storage,
    DateNoTimeZone,
    Notice,
    get_timezone_time,
    Dialog,
    RegularDialogNotice
 } from "./storage.js";

 import convert from "https://esm.sh/convert-units";

const current_city = {
    name: null,
    coordinate: null,
};

const dl = new Dialog(document.getElementById('dlg_notice'));
const display_error_dl = new RegularDialogNotice(document.getElementById('dlg_onerror'));
const notice = new Notice(document.getElementById('notice_info'));
const localst = new Storage((msg) => notice.output_warn(msg, 3500));

/**
 * 
 * @returns {{latitude: string, longitude: string} | boolean} - if url param is okay, return the latitude and longitude, if no retuen false
 */
function urlparam_check() {
    if (url_param.get('latitude') === null || url_param.get('longitude') === null) return

    const latitude = parseFloat(url_param.get('latitude'));
    const longitude = parseFloat(url_param.get('longitude'));

    if(isNaN(latitude) || isNaN(longitude) ||
        latitude > 90 || latitude < -90 ||
        longitude > 180 || longitude < -180){
            notice.output_error('latitude or longitude is not an available value')
            return false
    } else {
        return {
            latitude: latitude.toFixed(4),
            longitude: longitude.toFixed(4)
        }
    }
}

/**
 * 
 * @param {number} latitude 
 * @param {number} longitude 
 */
async function get_point(latitude, longitude) {
    console.log('get-point', latitude, longitude)
    const result = await get_content(`https://api.weather.gov/points/${latitude},${longitude}`)
    if (result === null) {
        throw new Error('Unable to fetch weather data. The weather service may be temporarily unavailable.')
    }
    return result
}

function share_location(){
    if(current_city.coordinate === null) {
        return
    }
    // const current_copy_url = `index.html?latitude=${current_city.coordinate[1]}&longitude=${current_city.coordinate[0]}`;
    const current_copy_url = 'sharing is not available for now'
    dl.dialog.querySelector('.share_display_url').textContent = current_copy_url;
    dl.open();
}

function copy_to_clipboard(text) {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text);
    notice.output_log('Copy ok!')
}

/**
 * 加载内容到页面，传入的值必须是从美国官方天气预报api获取的第一步信息(point/lati..., longit...)
 * @param {object} content - the information that gets from weather.gov
 */
async function load_display_content(content) {
    console.time('time spent');
    console.time('API requests');
    const display_cityname = document.getElementsByClassName('DISPLAY_current_cityname')
    const display_coordinates = document.getElementById('display_position');
    const display_temperature = document.getElementsByClassName('DISPYAY_temperature');
    const display_weathertext = document.getElementById('display_current_weathertext');

    const display_visibility = document.getElementsByClassName('DISPLAY_visibility');
    const display_wind_direction = document.getElementsByClassName('DISPLAY_wind_direction');
    const display_wind_speed = document.getElementsByClassName('DISPLAY_wind_speed');
    const display_humidity = document.getElementsByClassName('DISPLAY_humidity');

    const sunlight_normal = document.getElementsByClassName('normal_sunlight');
    const sunlight_civil_twilight = document.getElementsByClassName('civil_twilight');
    const sunlight_nautical_twilight = document.getElementsByClassName('nautical_twilight');
    const sunlight_astronomical_twilight = document.getElementsByClassName('astronomical_twilight');
    const transit_ds = document.getElementById('display_transit');

    const hourly_forecast_list = document.getElementById('hourly_forecast_list');
    const daily_forecast_list = document.getElementById('daily_forecast_list');
    const forecast_zone_name = document.getElementById('display_forecast_zone_name');

    const public_latitude = document.getElementById('public_latitude');
    const public_longitude = document.getElementById('public_longitude');
    const public_forecast_zone_arr = document.getElementById('public_forecast_zone');

    console.log('content: ', content)
    const urls = {
        forecast: content.properties.forecast,
        forecast_hourly: content.properties.forecastHourly,
        observation_station: content.properties.observationStations,
        forecast_zone: content.properties.forecastZone
    }

    // console.time('promise.all')
    // let [
    //     current_properties,
    //     forecast_zone_info,
    //     forcasts,
    //     localtime,
    //     daily_forecasts
    // ] = await Promise.all([
    //     get_current_temperature(urls.observation_station),
    //     get_content(urls.forecast_zone),
    //     get_content(urls.forecast_hourly),
    //     get_timezone_time(content.properties.timeZone),
    //     get_content(urls.forecast)
    // ]);
    // console.timeEnd('promise.all')

    const results = await Promise.allSettled([
        get_current_temperature(urls.observation_station),
        get_content(urls.forecast_zone),
        get_content(urls.forecast_hourly),
        get_timezone_time(content.properties.timeZone),
        get_content(urls.forecast)
    ]);
    console.timeEnd('API requests');
    console.time('data processing');

    const current_properties = (results[0].status === 'fulfilled' ? results[0].value : null);
    const forecast_zone_info = (results[1].status === 'fulfilled' ? results[1].value : null);
    let forcasts = (results[2].status === 'fulfilled' ? results[2].value : null);
    const localtime = (results[3].status === 'fulfilled' ? results[3].value : null);
    const daily_forecasts = (results[4].status === 'fulfilled' ? results[4].value : null);

    // const current_properties = await get_current_temperature(urls.observation_station);
    // const forecast_zone_info = await get_content(urls.forecast_zone);

    console.log('forecast zone info: ', forecast_zone_info)
    
    console.log('observation properties: ', current_properties);

    // let forcasts = await get_content(urls.forecast_hourly);
    console.log('hourly forecasts: ', forcasts)
    let weathertext = forcasts.properties.periods[0].shortForecast;
    forcasts = (forcasts.properties.periods).slice(1, 50);
    
    // const localtime = await get_timezone_time(content.properties.timeZone);

    // let daily_forecasts = await get_content(urls.forecast);

    const city_info = {
        coordinates: content.properties.relativeLocation.geometry.coordinates,

        name: content.properties.relativeLocation.properties.city,
        state: content.properties.relativeLocation.properties.state,
        localtime: localtime,
        display_temperature: `${c_to_f(current_properties.temperature.value)}°F`,
        display_weathertext: weathertext,

        visibility: convert_meter_to_ft_or_miles(current_properties.visibility.value),
        wind_direction: `${convert_deg_dir(current_properties.windDirection.value)}`,
        wind_speed: conver_kmh_mph(current_properties.windSpeed.value),
        humidity: current_properties.relativeHumidity.value,

        sunlight: {
            transit_time: new DateNoTimeZone(content.properties.astronomicalData.transit),

            normal_sunrise: new DateNoTimeZone(content.properties.astronomicalData.sunrise),
            normal_sunset: new DateNoTimeZone(content.properties.astronomicalData.sunset),

            civil_twilight_begin: new DateNoTimeZone(content.properties.astronomicalData.civilTwilightBegin),
            civil_twilight_end: new DateNoTimeZone(content.properties.astronomicalData.civilTwilightEnd),

            nautical_twilight_begin: new DateNoTimeZone(content.properties.astronomicalData.nauticalTwilightBegin),
            nautical_twilight_end: new DateNoTimeZone(content.properties.astronomicalData.nauticalTwilightEnd),

            astronomical_twilight_begin: new DateNoTimeZone(content.properties.astronomicalData.astronomicalTwilightBegin),
            astronomical_twilight_end: new DateNoTimeZone(content.properties.astronomicalData.astronomicalTwilightEnd),
        },

        forecast_zone: {
            polygon: forecast_zone_info.geometry.coordinates,
            polygon_type: forecast_zone_info.geometry.type,
            forecast_zone_name: forecast_zone_info.properties.name,
            forecast_zone_id: forecast_zone_info.properties.id
        }
    }

    forecast_zone_name.textContent = `${city_info.forecast_zone.forecast_zone_name} (${city_info.forecast_zone.forecast_zone_id})`;
    public_forecast_zone_arr.value = JSON.stringify({
        polygon: city_info.forecast_zone.polygon,
        poly_type: city_info.forecast_zone.polygon_type
    })

    const sl = city_info.sunlight;
    console.log('city info: ', city_info);

    current_city.name = `${city_info.name}, ${city_info.state}`;
    current_city.coordinate = city_info.coordinates

    public_latitude.value = city_info.coordinates[1];
    public_longitude.value = city_info.coordinates[0];

    document.title = `${city_info.name}, ${city_info.state}`;

    console.log('daily_forecast: ', daily_forecasts);

    put_content_to_page(display_cityname, `${city_info.name}, ${city_info.state}`)
    // display_coordinates.textContent = `(${city_info.coordinates[1]}, ${city_info.coordinates[0]})`; // 现在，显示坐标的地方用来显示本地时间
    display_coordinates.textContent = city_info.localtime;
    put_content_to_page(display_temperature, city_info.display_temperature)
    display_weathertext.textContent = city_info.display_weathertext;

    put_content_to_page(display_visibility, city_info.visibility);
    put_content_to_page(display_wind_direction, city_info.wind_direction);
    put_content_to_page(display_wind_speed, city_info.wind_speed);
    // put_content_to_page(display_humidity, city_info.humidity);
    put_content_to_page(display_humidity, (city_info.humidity === null ? "unavilable" : `${(city_info.humidity).toFixed(1)}%`))

    put_content_to_page(sunlight_normal, `
        <p>Sunrise: ${sl.normal_sunrise.toTimeString()}</p>
        <p>Sunset: ${sl.normal_sunset.toTimeString()}</p>
        <p>The time when the sun comes up or goes down at the horizon</p>`, true);
    put_content_to_page(sunlight_civil_twilight, `
            <p>Twilight Begin: ${sl.civil_twilight_begin.toTimeString()}</p>
            <p>Twilight End: ${sl.civil_twilight_end.toTimeString()}</p>
            <p>The sun is just below the horizon. The sky is bright, and you can see well.</p>`, true);
    put_content_to_page(sunlight_nautical_twilight, `
        <p>Twilight Begin: ${sl.nautical_twilight_begin.toTimeString()}</p>
        <p>Twilight End: ${sl.nautical_twilight_end.toTimeString()}</p>
        <p>The sun is deeper below the horizon. The sky is darker, but you can still see the sea line.</p>`, true);
    put_content_to_page(sunlight_astronomical_twilight, `
        <p>Twilight Begin: ${sl.astronomical_twilight_begin.toTimeString()}</p>
        <p>Twilight End: ${sl.astronomical_twilight_end.toTimeString()}</p>
        <p>Sky is fully dark after the astronomical twilight end, and stars can be seen well.</p>`, true)
    transit_ds.textContent = sl.transit_time.toTimeString();

    let hrly_fo_content = '';
    for(let i = 0; i < forcasts.length; i++) {
        let f = forcasts[i];
        let time = new DateNoTimeZone(f.startTime);
        hrly_fo_content += `
            <div class="hourly_forecast_item">
                    <img src="${f.icon}" alt="forecast_icon">
                    <div class="hourly_forecast_item_detail">
                        <span>${to12Hour(time.getHours())}</span>
                        <br>
                        <span><strong>${f.temperature}°F</strong></span>
                    </div>
                </div>
        `
    }
    hourly_forecast_list.innerHTML = hrly_fo_content;

    let dly_fo = '';
    for(let r = 0; r < daily_forecasts.properties.periods.length; r++) {
        let c = daily_forecasts.properties.periods[r];
        const time = new DateNoTimeZone(c.startTime);

        dly_fo += `
        <div class="forecast_card">
            <div class="card_main">
                <div class="weather_summary">
                    <img src="${c.icon}" alt="weather" class="weather_icon">
                    <div class="weather_info">
                        <span class="date_label">${time.toDateString()}</span>
                        <h3 class="name">${c.name}</h3>
                        <p class="short_forecast">${c.shortForecast}</p>
                    </div>
                </div>
                <div class="temperature">${c.temperature}°F</div>
                <button class="expand_btn" aria-label="Toggle details">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
            </div>

            <div class="card_details">
                <div class="details_inner">
                    <hr>
                    <p class="detailed_forecast">${c.detailedForecast}</p>
                    <div class="extra_stats">
                        <span><strong>Wind</strong> ${c.windDirection} ${c.windSpeed}</span>
                        <span><strong>Rain</strong> ${c.probabilityOfPrecipitation.value}%</span>
                    </div>
                </div>
            </div>
        </div>
        `
    }
    daily_forecast_list.innerHTML = dly_fo;
    active_forecast_card();
    console.timeEnd('data processing');
    console.time('page rendering');

    load_saved_city_list();

    // notice.output_debug('load done')
    console.log('content loaded')
    document.getElementById('to_listen_event_to_know_it_loaded').click();
    console.timeEnd('page rendering');
    console.timeEnd('time spent');
}

function conver_kmh_mph(kmh) {
    if(kmh === null || isNaN(kmh)) {
        return "unavailable"
    }
    return `${convert(kmh).from('km/h').to('m/h').toFixed(2)} mph`
}

function active_forecast_card(){
    const cards = document.getElementsByClassName('forecast_card');

    Array.from(cards).forEach(card => {
        const btn = card.querySelector('.expand_btn');
        
        btn.addEventListener('click', () => {
            const isExpanded = card.classList.toggle('is-expanded');
            btn.setAttribute('aria-expanded', isExpanded);

            Array.from(cards).forEach(otherCard => {
                if (otherCard !== card) otherCard.classList.remove('is-expanded');
            });
        });
    });
}

function load_saved_city_list() {
    const saved_city_el = document.getElementById('location_list');
    const saved_city = localst.get_local_setting();

    let svct = '';
    console.log('saved city: ', saved_city.cities)
    for(let a = 0; a < saved_city.cities.length; a++) {
        const b = saved_city.cities[a];
        svct += `
            <li class="location_list_item">
                            <a href="index.html?latitude=${b.coordinate[1]}&longitude=${b.coordinate[0]}">${b.name}</a>
                            <button class="delete_saved_city_btn" onclick="delete_city_from_list(${a})">delete</button>
                        </li>
        `
    }
    saved_city_el.innerHTML = svct;
}
function delete_city_from_list(idx) {
    localst.delete_city(idx);
    load_saved_city_list();
}

function add_current_city_to_saved_city(){
    localst.add_city({
        name: current_city.name,
        coordinate: [current_city.coordinate[0], current_city.coordinate[1]]
    });
    load_saved_city_list();
}
window.add_current_city_to_saved_city = add_current_city_to_saved_city;
window.load_saved_city_list = load_saved_city_list;
window.delete_city_from_list = delete_city_from_list;

/**
 * 
 * @param {HTMLElement} el 
 * @param {any} content 
 * @param {boolean} isHTML
 */
function put_content_to_page(el, content, isHTML = false) {
    Array.from(el).forEach((el) => {
        if (isHTML) {
            el.innerHTML = content;
        } else {
            el.textContent = content;
        }
    })
}

async function init() {
    const is_urlparam_okay = urlparam_check();
    if (is_urlparam_okay) {
        console.log('available url param detected')
        try {
            console.time('get_point');
            const resu = await get_point(is_urlparam_okay.latitude, is_urlparam_okay.longitude);
            console.timeEnd('get_point');
            await load_display_content(resu)
            document.getElementById('notice_when_use_paramurl').style.display = 'flex'
        } catch(error) {
            console.error('Error loading weather data:', error)
            display_error_dl.open(`Failed to load weather data: ${error.message}`);
        }
        return
    }
    let is_current_location_able = false;
    let location = ''
    try{
        console.time('get_current_location');
        location = await get_current_location();
        console.timeEnd('get_current_location');
        is_current_location_able = true
    } catch(error) {
        console.error(error);
        // notice.output_error(`we cant get your location: ${error.message}`, 3000)
        display_error_dl.open('we cant get your location!');
    }
    if(is_current_location_able) {
        const location_latitude = location.coords.latitude.toFixed(4);
        const location_longitude = location.coords.longitude.toFixed(4);
        console.log('ready for get the weather of your location: ', location);
    
        try {
            console.time('get_point');
            const result = await get_point(location_latitude, location_longitude);
            console.timeEnd('get_point');
            console.log('got potnt: ', result)
            await load_display_content(result)
        } catch(error) {
            console.error('Error loading weather data:', error)
            display_error_dl.open(`Failed to load weather data: ${error.message}`);
        }
        
    }
}

async function init_maual() {
    notice.output_log('start initialzation')
    await init();
}

function DEBUG_notice(text, time = 2000){
    notice.output_debug(text, time)
}
window.init = init_maual;
window.localst = localst;
window.current_city = current_city;
window.shownotice = DEBUG_notice;
window.share_location = share_location;
window.copy_to_clipboard = copy_to_clipboard;

document.addEventListener('DOMContentLoaded', init)