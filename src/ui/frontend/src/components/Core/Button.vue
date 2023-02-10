<template>
  <span class="rounded-md shadow-sm whitespace-nowrap">
    <button :type="type" :disabled="disabled"
      :class="[
        classes.all,
        classes[kind],
        classes.size[size],
        loading ? classes.loading : '',
        disabled ? classes.disabled : '',
        full ? 'w-full justify-center': 'inline-flex'
      ]">
      <slot></slot>
      <ArrowPathIcon v-if="loading" class="ml-3 w-4 h-4 animate-spin" />
    </button>
  </span>
</template>

<script setup>
  import { computed } from 'vue'
  import { ArrowPathIcon } from '@heroicons/vue/24/outline'

  const props = defineProps({
    type: {
      type: String,
      validator: (val) => ['button', 'submit', 'reset'].includes(val),
      default: 'button'
    },

    kind: {
      type: String,
      validator: (val) => ['primary', 'secondary', 'destructive'].includes(val),
      default: 'secondary'
    },

    size: {
      type: String,
      validator: (val) => ['sm', 'base', 'xl'].includes(val),
      default: 'base'
    },

    disabled: {
      type: Boolean,
      default: false
    },

    loading: {
      type: Boolean,
      default: false
    },

    full: {
      type: Boolean,
      default: false
    },

    outline: {
      type: Boolean,
      default: false,
    }
  })

  const classes = computed(() => {
    return {
      all: `inline-flex items-center border-2 border-transparent font-medium rounded focus:outline-none focus:ring-blue transition ease-in-out duration-75`,
      primary: `focus:border-blue-300 ${!props.disabled ? 'hover:bg-blue-500 active:bg-blue-700' : ''} ${props.outline ? 'border-blue-500 text-blue-500 hover:text-white' : 'bg-blue-700 text-white'}`,
      destructive: `focus:border-red-300 ${!props.disabled ? 'hover:bg-red-500 active:bg-red-700' : ''} ${props.outline ? 'border-red-500 text-red-500 hover:text-white' : 'bg-red-700 text-white'}`,
      secondary: `text-gray-700 bg-white border-gray-300 focus:border-blue-300 ${!props.disabled ? 'hover:bg-gray-100 active:text-gray-800 active:bg-gray-200': ''} ${props.outline ? 'border-gray-400' : ''}`,
      loading: 'opacity-50 cursor-not-allowed',
      size: {
        sm: 'px-2 py-1 text-xs',
        base: 'px-4 py-2 text-sm',
        xl: 'px-6 py-3 text-base'
      },
      disabled: 'opacity-50 cursor-not-allowed',
    }
  })
</script>
