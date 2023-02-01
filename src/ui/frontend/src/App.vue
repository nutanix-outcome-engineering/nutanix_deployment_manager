<script>
import { RouterLink, RouterView } from 'vue-router'
import Application from './layouts/Application.vue'
import Empty from './layouts/Empty.vue'

export default {
  name: 'App',
  components: {Application, Empty},
  computed: {
    layout() {
      if (this.$route.name == null) {
        return 'Empty'
      }
      return this.$route.meta.layout || 'Application'
    }
  }
}


</script>

<template>
  <component :is="layout">
    <router-view />
  </component>
  </template>
