<template>
  <a v-if="isExternalLink" v-bind="$attrs" :href="to" target="_blank">
    <slot />
  </a>
  <router-link
    v-else
    v-bind="$props"
    custom
    v-slot="{ isExactActive, isActive, href, navigate }"
  >
    <a
      v-bind="$attrs"
      :href="href"
      @click="navigate"
      :class="isExactActive ? exactActiveClass : (isActive ? activeClass : inactiveClass)"
    >
      <slot />
    </a>
  </router-link>
</template>

<script>
import { RouterLink } from 'vue-router'

export default {
  name: 'AppLink',
  inheritAttrs: false,

  props: {
    // add @ts-ignore if using TypeScript
    ...RouterLink.props,
    inactiveClass: String,
  },

  computed: {
    isExternalLink() {
      return typeof this.to === 'string' && this.to.startsWith('http')
    }
  },

  methods: {
    classes({ isExactActive, isActive }) {
      if (isExactActive) {
        return this.exactActiveClass
      }

      if (isActive) {
        return this.activeClass
      }

      return this.inactiveClass
    }
  }
}
</script>
