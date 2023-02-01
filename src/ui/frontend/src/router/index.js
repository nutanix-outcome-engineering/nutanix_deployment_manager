import { createRouter, createWebHistory } from 'vue-router'
import ClusterImport from '../views/ClusterImport.vue'
import Login from '../views/Login.vue'
import useAxios from '@/composables/useAxios.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: ClusterImport,
      meta: {
        auth: true
      }
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: {
        auth: false,
        layout: 'Empty'
      }
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
      meta: {
        auth: true
      }
    }
  ]
})
router.beforeEach(async (toRoute, fromRoute, next) => {
  if(toRoute.matched.some(route => route.meta.auth)) {
    const {axios} = useAxios()
    try {
      await axios.get('/permissions')
      next()
    }
    catch {
      next({ name: 'login'})
    }
  }
  else {
    next()
  }
})


export default router
