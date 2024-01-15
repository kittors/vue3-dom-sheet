import { createRouter, createWebHashHistory } from 'vue-router';

import tableDemo from '../views/home.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: tableDemo
        },
    ]
})

export default router;
