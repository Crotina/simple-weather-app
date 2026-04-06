# Simple Weather App

此天气app使用美国政府的官方API获取信息，对于美国以外的地区可能无法工作
This app uses the United States government's weather API, it donsn't work for locations outside the USA.

**for api info: [National Weather Service](https://www.weather.gov/documentation/services-web-api)**

- 我在app里添加了一个地图，因为我之前在返回的数据里发现有polygon信息，我还没把它们做进地图，但是我做了根据得到的经纬线生成地点标记的功能，你可以知道你的位置了
I added a map into the app because I saw there's some polygon array in the data from the api. I didn't put them into map yet, but you can check your location in the map now

- 每次的定位都会很慢，这可能需要制作一些缓存之类的机制来缓解
it's very slow to get user's location, maybe I need to make like cache to solve this matter

- added loading animation