export const url_param = new URLSearchParams(window.location.search);

export class Notice {

    /**
     * 
     * @param {HTMLElement} el 
     */
    constructor(el) {
        this.el = el;
        this.el_text = el.querySelector('.info__title');
    }
    _open(text) {
        this.el_text.textContent = text;
        this.el.classList.add('show');
    }
    _close(class_added) {
        this.el.classList.remove(class_added);
        this.el.classList.remove('show');
    }
    output_log(text, time = 2000) {
        this.el.classList.add('log');
        this._open(text);
        setTimeout(() => {
            this._close('log');
        }, time);
    }
    output_warn(text, time = 2000) {
        this.el.classList.add('warn');
        this._open(text);
        setTimeout(() => {
            this._close('warn');
        }, time);
    }
    output_error(text, time = 2000) {
        this.el.classList.add('error');
        this._open(text);
        setTimeout(() => {
            this._close('error');
        }, time);
    }
    output_debug(text, time = 2000) {
        this.el.classList.add('debug');
        this._open(`debug: ${text}`);
        setTimeout(() => {
            this._close('debug');
        }, time);
    }
}



export class Dialog {
    /**
     * @param {HTMLDialogElement} dialogEl 最外侧的 Dialog 元素
     */
    constructor(dialogEl){
        this.dialog = dialogEl;
        this.contentBox = dialogEl.querySelector('.content');
        this.closeBtn = dialogEl.querySelector('.close');

        this._close = this._close.bind(this);

        this.closeBtn.addEventListener('click', this._close);
    }
    open(){
        this.dialog.showModal();
    }

    _close(){
        this.dialog.close();
    }

    close(){
        this._close();
    }
}

export class RegularDialogNotice {
    /**
     * @param {HTMLDialogElement} dialogEl 最外侧的 Dialog 元素
     */
    constructor(dialogEl){
        this.dialog = dialogEl;
        this.contentBox = dialogEl.querySelector('.content');
        this.closeBtn = dialogEl.querySelector('.close');

        this._close = this._close.bind(this);

        this.closeBtn.addEventListener('click', this._close);
    }

    /**
     * 打开 dialog 并设置内容
     * @param {string | HTMLElement} content - content
     */
    open(content, display_as_element = false){
        if (display_as_element) {
            this.contentBox.innerHTML = content;
        } else {
            if(typeof content === 'string'){
                this.contentBox.textContent = content;
            } else if(content instanceof HTMLElement){
                this.contentBox.innerHTML = '';
                this.contentBox.appendChild(content);
                // this.contentBox.innerHTML = content;
            }
        }
        
        this.dialog.showModal();
    }

    _close(){
        this.dialog.close();
    }

    close(){
        this._close();
    }
}

function _notice(content) {
    // const n = new Notice(document.getElementById('notice_info'));
    // n.output_error(`!!! ERROR: ${content}`, 25000);
    const m = new RegularDialogNotice(document.getElementById('notice_info'));
    m.open(`!!! ERROR: ${content}`);
}

/**
 * 
 * @returns location that include x and y axis
 */
export async function get_current_location() {
    return new Promise((resolve, reject) => {
        if(!navigator.geolocation) {
            reject('failed to get location: geolocation not support');
            return
        }
        navigator.geolocation.getCurrentPosition((ok) => resolve(ok), (not_ok)=>reject(not_ok), {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 600000
        })
    })

}

/**
 * 
 * @param {string} url - url
 * @returns {object | null}
 */
export async function get_content(url) {
    try {
        const response = await fetch(url);

        if(!response.ok) {
            throw new Error(`response status: ${response.status}`)
        }

        const result = await response.json();
        // console.log(result)
        return result
    } catch(error) {
        console.error(error);
        _notice(`FAILED TO GET CONTENT: ${error}`)
        return null
    }
}

/**
 * 
 * @param {string} observation_stations_url - url of observation station
 * @returns {object | null}
 */
export async function get_current_temperature(observation_stations_url = null) {
    if(observation_stations_url === null) return null

    const observation_list = await get_content(observation_stations_url)
    if (observation_list === null) {console.error('js err');return null}
    console.log(observation_list.observationStations[0])

    const current_temp_url = await get_content(`${observation_list.observationStations[0]}/observations/latest`);

    console.log('observasion full info: ', current_temp_url)
    return current_temp_url.properties
   
}

/**
 * 
 * @param {number} deg - degree
 * @returns {string} - direction
 */
export function convert_deg_dir(deg) {
  if (deg == null || isNaN(deg)) return "unavailable";

  deg = (deg % 360 + 360) % 360;

  const directions = [
    "N",// 0°
    "NNE",// 22.5°
    "NE",// 45°
    "ENE",// 67.5°
    "E",// 90°
    "ESE",// 112.5°
    "SE",// 135°
    "SSE",// 157.5°
    "S",// 180°
    "SSW",// 202.5°
    "SW",// 225°
    "WSW",// 247.5°
    "W",// 270°
    "WNW",// 292.5°
    "NW",// 315°
    "NNW"// 337.5°
  ];

  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

/**
 * 
 * @param {number} meter - meter
 * @returns {string} a length with unit
 */
export function convert_meter_to_ft_or_miles(meters){
    if (meters == null || isNaN(meters)) return "unavailable";
    
    if((meters * 3.28084) > 1319) {
        let a = ((meters * 3.28084) / 5280).toFixed(2);
        return `${a} miles`
    } else {
        return `${(meters * 3.28084).toFixed(2)} ft`
    }
}

/**
 * 
 * @param {number} hr_24 - a time in 24 hr
 */
export function to12Hour(hour24) {
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12} ${period}`;
}

export class Storage{
    /**
     * 
     * @param {Function} function_for_notice - a function to show notice
     */
    constructor(function_for_notice = (msg) => {console.log(msg)}){
        this.LOCAL_STORAGE_KEY = 'SAVEDCITY';
        this.function_for_notice = function_for_notice;
    }

    _cover_storage(obj) {
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(obj));
    }

    _reset_storage(){
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify({
                    cities: [],
                }))
    }

    get_local_setting() {
        const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
        if (data != null) {
            let jsondata = JSON.parse(data);
            return jsondata
        } else {
            this._reset_storage();
            return this.get_local_setting();
        }
    }

    clear_saved_locations(){
        localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    }
    
    /**
     * 
     * @param {{name: string, coordinate: [latitude: number, longitude: number]}} cityobj 
     * @returns 
     */
    add_city(cityobj) {
        if(typeof(cityobj.name) != 'string' || !Array.isArray(cityobj.coordinate)){
            console.error(cityobj, 'error value', )
            return
        }
        if (!cityobj.coordinate[0] || !cityobj.coordinate[1]){
            console.error(cityobj, 'error in coordinate');
            return
        }

        const data = this.get_local_setting();

        if (data.cities.find((u) => u.name === cityobj.name)) {
            this.function_for_notice('duplicate name found!');
            return
        }

        data.cities.push(cityobj);
        this._cover_storage(data);
    }
    delete_city(idx) {
        idx = parseInt(idx);
        if(isNaN(idx)) {return}
        const data = this.get_local_setting();
        if(data.cities.length == 0) return
        data.cities.splice(idx, 1);
        console.log(data)
        this._cover_storage(data)
    }
}

export class Dialog_notice{
    /**
     * 
     * @param {HTMLElement} el - a dialog element
     */
    constructor(el) {
        this.el = el
    }
}

export const c_to_f = (c) => {return (c*9/5+32).toFixed(0)}

export class DateNoTimeZone {
    constructor(dateString) {
        // 只取前面的时间部分，不管时区
        const match = dateString.match(
            /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/
        );

        if (!match) {
            throw new Error("Invalid date format");
        }

        const [
            _,
            year, month, day,
            hour, minute, second
        ] = match;

        this.year = parseInt(year);
        this.month = parseInt(month) - 1;
        this.day = parseInt(day);
        this.hour = parseInt(hour);
        this.minute = parseInt(minute);
        this.second = parseInt(second);
    }

    _pad(n){ return n.toString().padStart(2, "0") }

    /**
     * 
     * @param {number} hour24 
     * @returns {[number, string]}
     */
    _hour24To12(hour24) {
        const period = hour24 >= 12 ? "PM" : "AM";
        const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

        return [this._pad(hour12), period];
    }
    

    getFullYear() { return this.year; }
    getMonth() { return this.month; }
    getDate() { return this.day; }
    getHours() { return this.hour; }
    getMinutes() { return this.minute; }
    getSeconds() { return this.second; }
    toTimeString() {
        const converted_hr = this._hour24To12(this.hour);
        return `${converted_hr[0]}:${this._pad(this.minute)} ${converted_hr[1]}`
    }
    toDateString(){ return `${this.month + 1} / ${this.day}` }
}

export async function get_timezone_time(timezone) {
    try {
        // const response = await fetch(`https://timeapi.io/api/time/current/zone/${timezone}`);
        const response = await fetch(`https://timeapi.io/api/Time/current/zone?timeZone=${timezone}`)
        if(!response.ok) {
            throw new Error('holy crab!')
        }
        const data = await response.json();
        console.log('timezone info: ', data)
        return new DateNoTimeZone(data.dateTime).toTimeString();
    } catch(error) {
        console.error(error);
        return null
        
    }
}

/**
 * 
 * @param {string} url - 跳转的目标url
 * @param {string} target - 跳转行为
 */
export function redirect(url, target = "_blank") {
    const a = document.createElement("a");
    a.href = url;
    a.target = target;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
