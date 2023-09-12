import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import Login from '../views/Login.vue'
import useAxios from '@/composables/useAxios.js'
const views = import.meta.glob('@/views/**/*.vue')

function lazy(name) {
  return views[`/src/views/${name}.vue`]
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: lazy('Sites/Sites'),
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
      path: '/clusters',
      name: "clusters",
      component: lazy('Clusters/Cluster'),
      meta: {
        auth: true
      }
    },
    {
      path: '/nodes',
      name: "nodes",
      component: lazy('Nodes/Shell'),
      meta: {
        auth: true
      },
      children: [
        {
          path: '',
          name: 'nodes.nodes',
          component: lazy('Nodes/Nodes'),
        },
        {
          path: 'ingesting',
          name: 'nodes.ingesting',
          component: lazy('Nodes/Ingesting'),
        }
      ]
    },
    {
      path: '/sites',
      name: "sites",
      component: lazy('Sites/Sites'),
      meta: {
        auth: true
      }
    },
    {
      path: '/racks',
      name: "racks",
      component: lazy('Racks/Racks'),
      meta: {
        auth: true
      }
    },
    {
      path: '/switches',
      name: "switches",
      component: lazy('Switches/Switches'),
      meta: {
        auth: true
      }
    },
    {
      path: '/discover',
      name: 'discovery',
      component: lazy('Discovery/Discovery'),
      meta: {
        auth: true
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
