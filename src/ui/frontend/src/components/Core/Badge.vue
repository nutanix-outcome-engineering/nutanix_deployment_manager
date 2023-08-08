<template>
  <span :class="[classes.all, outline ? classes.outline[color] : '']">
    <div v-if="label" class="py-1 pl-3 pr-2" :class="classes.label[color]">{{ label }}</div>
    <span class="py-1 pl-2 pr-3" :class="classes.content[color]">
      <slot />
    </span>
  </span>
</template>

<script>
export default {
  name: 'Badge',

  props: {
    label: {
      type: String,
      required: false,
    },

    color: {
      type: String,
      validator: (val) => ['white', 'gray', 'blue', 'yellow', 'red', 'green'].includes(val),
      default: 'white'
    },

    outline: Boolean,
  },

  data() {
    return {
      classes: {
        all: 'overflow-hidden inline-flex items-center rounded-full text-xs font-medium leading-4 whitespace-nowrap',
        label: {
          white: 'text-gray-700',
          gray: 'bg-gray-300 text-gray-700',
          blue: 'bg-blue-700 text-white',
          yellow: 'bg-yellow-400 text-white',
          orange: 'bg-orange-50 text-white',
          red: 'bg-red-700 text-white',
          green: 'bg-green-700 text-white'
        },
        content: {
          white: 'bg-white text-gray-700',
          gray: 'bg-gray-50 text-gray-700',
          blue: 'bg-blue-50 text-blue-700',
          yellow: 'bg-yellow-50 text-yellow-700',
          orange: 'bg-orange-50 text-orange-700',
          red: 'bg-red-50 text-red-700',
          green: 'bg-green-50 text-green-700'
        },
        outline: {
          white: 'border-2 border-gray-500',
          gray: 'border-2 border-gray-200',
          blue: 'border-2 border-blue-500',
          yellow: 'border-2 border-yellow-500',
          orange: 'border-2 border-orange-500',
          red: 'border-2 border-red-500',
          green: 'border-2 border-green-500'
        },
      }
    }
  },

  mounted() {
    if (this.$slots.default === undefined) {
      console.error("Badge component requires slot content.")
    }
  }
}
</script>
