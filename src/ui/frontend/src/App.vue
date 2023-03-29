<script>
import { RouterLink, RouterView } from 'vue-router'
import Application from './layouts/Application.vue'
import Empty from './layouts/Empty.vue'
import Toast from '@/components/Core/Notification/Toast.vue'
import useToasts from '@/composables/useToasts.js'


export default {
  name: 'App',
  components: {Application, Empty, Toast},
  setup() {
    const { toasts, close } = useToasts()
    return {
      toasts,
      close
    }
  },
  computed: {
    layout() {
      if (this.$route.name == null) {
        return 'Empty'
      }
      return this.$route.meta.layout || 'Application'
    },
  }
}


</script>

<template>
  <component :is="layout">
    <router-view />
  </component>

  <transition-group tag="div" class="fixed top-0 right-0 z-50 w-full max-w-md flex flex-col items-end justify-center px-4 py-6 pointer-events-none space-y-4"
      enter-active-class="transition-all duration-150 ease-out"
      leave-active-class="transition-all duration-100 ease-in"
      enter-class="opacity-0"
      enter-to="opacity-100"
      leave-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <Toast v-for="toast in toasts" :key="toast.id" :heading="toast.heading" :type="toast.type" @dismiss="close(toast.id)">
        {{ toast.text }}
      </Toast>
    </transition-group>
</template>
