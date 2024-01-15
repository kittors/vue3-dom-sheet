// main.ts
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import store from './store';
import 'element-plus/dist/index.css'
import "./tableContainer/tableStyle/style.css";
import "./css/global.css"
import App from './App.vue'
import router from './router';
const app = createApp(App)


app.use(ElementPlus)
app.use(router)
app.use(store);
app.mount('#app')