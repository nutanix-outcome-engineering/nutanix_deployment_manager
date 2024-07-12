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
      path: '/passreset',
      name: 'changepass',
      component: lazy('ChangeUserPassword'),
      meta: {
        auth: true,
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
          path: 'discovery',
          name: 'nodes.discoveryShell',
          children: [
            {
              path: '',
              name: 'nodes.discovery',
              component: lazy('Nodes/Discovery')
            },
            {
              path: 'ingesting',
              name: 'nodes.ingesting',
              component: lazy('Nodes/Ingesting'),
            },
            {
              path: 'review',
              name: 'nodes.pendingReview',
              component: lazy('Nodes/PendingReview')
            }
          ]
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
      path: '/sites/:id',
      name: 'sites.overview',
      component: lazy('Sites/Overview'),
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
      path: '/foundation',
      name: 'foundation',
      component: lazy('Foundation/Foundation'),
      meta: {
        auth: true
      }
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: lazy('Tasks/Shell'),
      meta: {
        auth: true
      },
      children: [
        {
          path: '',
          name: 'task.list',
          component: lazy('Tasks/TaskList'),
        },
        {
          path: ':id',
          name: 'task.overview',
          component: lazy('Tasks/Task')
        }
      ]
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
    },
    {
      path: "/:pathMatch(.*)*",
      component: lazy('NotFound'),
      meta: { auth: true}
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
