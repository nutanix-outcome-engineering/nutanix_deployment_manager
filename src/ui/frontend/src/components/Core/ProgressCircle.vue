<template>
  <svg
    :height="radius * 2"
    :width="radius * 2"
    :class="[ '-rotate-90']"
  >
    <circle
      :class="trackColors[color]"

      fill="transparent"
      :stroke-width="stroke"
      :r="normalizedRadius"
      :cx="radius"
      :cy="radius"
    />

    <circle
      :class="colors[color]"
      fill="transparent"
      :stroke-dasharray="circumference + ' ' + circumference"
      :style="{ strokeDashoffset }"
      :stroke-width="stroke"
      :r="normalizedRadius"
      :cx="radius"
      :cy="radius"
    />

    <text
      class="text-xs translate-x-1/2 translate-y-1/2 rotate-90"
      text-anchor="middle"
    >
      {{ modelValue }}%
    </text>
  </svg>
</template>

<script>
export default {
  name: 'ProgressCircle',

  props: {
    modelValue: {
      type: Number,
      required: true
    },

    color: {
      type: String,
      validator: val => ['red', 'green', 'blue', 'yellow'].includes(val),
      default: 'green'
    },

    radius: {
      type: Number,
      default: 28
    },

    stroke: {
      type: Number,
      default: 3
    }
  },

  data() {
    const normalizedRadius = this.radius - this.stroke * 2
    const circumference = Math.PI * normalizedRadius * 2

    return {
      normalizedRadius,
      circumference,
      colors: {
        red: 'stroke-red-600',
        green: 'stroke-green-400',
        blue: 'stroke-blue-600',
        yellow: 'stroke-yellow-500',
      },
      trackColors: {
        red: 'stroke-red-300',
        green: 'stroke-green-300',
        blue: 'stroke-blue-300',
        yellow: 'stroke-yellow-300',
      }
    }
  },

  computed: {
    strokeDashoffset() {
      return this.circumference - this.modelValue / 100 * this.circumference;
    }
  }
}
</script>
