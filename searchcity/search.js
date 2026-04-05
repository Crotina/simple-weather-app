import { url_param, redirect } from "../storage.js";

/**
 * 
 * @returns {Array}
 */
async function get_data() {
    let response = await fetch('./usa_cities.json');
    if (!response.ok) return

    let data = response.json()

    return data
}

const search_input = document.getElementById('search_input');
const search_btn = document.getElementById('search_btn');

search_btn.addEventListener('click', () => {
    const input_info = search_input.value;
    if (input_info == '') return

    redirect(`./index.html?keyword=${input_info}`, "_self")
});

/**
 * 
 * @param {string} keyword 
 * @returns {Array}
 */
async function search_for_data(keyword) {
    if(keyword === undefined || keyword == '') {
        return
    }
    keyword = keyword.toLowerCase()
    console.log('search for: ', keyword)
    const data = await get_data()
    let result = data.filter((u) => u.city_ascii.toLowerCase().includes(keyword));
    result = result.slice(0, 50)
    console.log('result: ', result)

    let rstdsply = '';
    for(let i = 0; i < result.length; i++) {
        const j = result[i];
        rstdsply += `
            <li class="location_list_item crotina">
                <a href="../index.html?latitude=${j.lat}&longitude=${j.lng}">${j.city_ascii}, ${j.state_id}</a>
            </li>
        `
    }
    document.getElementById('search_result_container').innerHTML = rstdsply;

    return result
}

async function init() {
    const param = url_param.get('keyword');
    if (param === null || param == '') {
        return
    }
    search_input.value = param
    search_for_data(param)
}

init();

window.search = search_for_data;