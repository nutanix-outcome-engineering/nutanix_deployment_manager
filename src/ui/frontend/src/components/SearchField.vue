<template>
  <div>
    <label for="search" class="sr-only">Search</label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 flex items-center pointer-events-none" :class="[iconSizeClasses[size]]">
        <MagnifyingGlassIcon name="magnifying-glass" class="h-5 w-5 text-gray-400" />
      </div>
      <input id="search" :value="modelValue" @input="debounceSearch" :class="[inputBaseClasses, inputSizeClasses[size]]" placeholder="Search" type="search" />
    </div>
  </div>
</template>

<script>
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

export default {
  name: 'SearchField',

  components: { MagnifyingGlassIcon },

  props: {
    modelValue: {
      type: String
    },

    debounce: {
      type: Number,
      default: 250
    },

    size: {
      type: String,
      validator: val => ['base', 'xl'].includes(val),
      default: 'base'
    }
  },

  data() {
    return {
      iconSizeClasses: {
        base: 'pl-3',
        xl: 'pl-5',
      },
      inputSizeClasses: {
        base: 'pl-10 pr-3 py-2 rounded-md leading-5 sm:text-sm',
        xl: 'pl-13 pr-3 py-4 rounded-md leading-5 sm:text-base',
      },
      inputBaseClasses: 'block w-full border border-gray-200 bg-gray-50 placeholder-gray-600 transition duration-150 ease-in-out'
    }
  },

  methods: {
    debounceSearch(event) {
      if (this.bounce) {
        clearTimeout(this.bounce)
      }

      this.bounce = setTimeout(() => {
        this.$emit('update:modelValue', event.target.value)
      }, this.debounce)
    }
  }
}
</script>
