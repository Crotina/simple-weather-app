import { Storage, redirect } from "./storage.js";

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});
// document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
//     hamburger.classList.remove('active');
//     navMenu.classList.remove('active');
// }));


const tabContainers = document.querySelectorAll('.tab');
tabContainers.forEach(container => {
    const tabButtons = container.querySelectorAll('.tablink');
    const tabContents = container.querySelectorAll('.tabcontent');

    tabButtons.forEach(button => {
        button.addEventListener('click', function () {
            const tabName = this.dataset.tab;
            const tabContent = container.querySelector(`#${tabName}`);

            // 隐藏当前容器内所有 tabcontent
            tabContents.forEach(c => c.style.display = 'none');

            // 移除当前容器内所有 tablink 的 active
            tabButtons.forEach(b => b.classList.remove('active'));

            // 显示当前 tab
            tabContent.style.display = 'block';
            this.classList.add('active');
        });
    });

    // 自动点击第一个 tablink
    if (tabButtons.length > 0) {
        tabButtons[0].click();
    }
});

const do_search = () => {
    const user_search_keyword = document.getElementById('search_city_input').value;
    console.log('user input: ', user_search_keyword);
    if(user_search_keyword == '') return

    redirect(`./searchcity/index.html?keyword=${user_search_keyword}`, "_self");
}
window.do_search = do_search;
document.getElementById('search_city').addEventListener('click', do_search)

// const storage = new Storage();
// const toggleBtn = document.getElementById("toggle_theme");
// const body = document.body;

// // 初始化：读取用户上次选择
// const settings = storage.get_local_setting();
// if (settings.color_mode === "dark") {
//     body.classList.add("dark-mode");
// }

// toggleBtn.addEventListener("click", () => {
//     const data = storage.get_local_setting();

//     // 切换 DOM class
//     const newMode = data.color_mode === "dark" ? "light" : "dark";
//     body.classList.toggle("dark-mode", newMode === "dark");

//     // 保存到 storage
//     data.color_mode = newMode;
//     storage._cover_storage(data);
// });
