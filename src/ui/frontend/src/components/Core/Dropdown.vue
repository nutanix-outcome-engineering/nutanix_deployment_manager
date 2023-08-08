<template>
  <div class="relative">
    <button ref="trigger" @click.stop.prevent type="button" class="block focus:outline-none w-full">
      <slot name="trigger" :isOpen="isOpen"></slot>
    </button>
    <div ref="dropdown">
      <slot name="dropdown" :actions="{ close }"></slot>
    </div>
  </div>
</template>

<script>
import tippy from 'tippy.js'

export default {
  name: 'Dropdown',

  tip: null,

  props: {
    disabled: Boolean,
    center: Boolean
  },

  data() {
    return {
      isOpen: false,
    }
  },

  mounted() {
    if (this.tip) {
      try {
        this.tip.destroy()
      } catch (error) {
        //
      }

      this.tip = null
    }

    this.tip = tippy(this.$refs.trigger, {
      content: this.$refs.dropdown,
      trigger: 'manual',
      duration: 0,
      interactive: true,
      theme: 'light-border',
      placement: this.center ? 'bottom' : 'bottom-end',
      popperOptions: {
        modifiers: [
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
            },
          },
        ]
      },
      onShown: () => {
        this.isOpen = true
      },
      onHidden: () => {
        this.isOpen = false
      }
    })

    document.addEventListener('keydown', this.onEscape)
    this.$refs.trigger.addEventListener('click', this.onClickTrigger)
    this.$refs.dropdown.addEventListener('click', this.onClickInside)
  },

  beforeUnmount() {
    document.removeEventListener('keydown', this.onEscape)
    this.$refs.trigger.removeEventListener('click', this.onClickTrigger)
    this.$refs.dropdown.removeEventListener('click', this.onClickInside)
  },

  methods: {
    onClickTrigger(e) {
      e.stopPropagation()

      if (!this.isOpen && !this.disabled) {
        this.tip.show()
      } else {
        this.tip.hide()
      }
    },

    onClickInside(e) {
      e.stopPropagation()

      if (this.isOpen) {
        this.tip.hide()
      }
    },

    onEscape(e) {
      if (!this.isOpen || e.key !== 'Escape') {
        return
      }

      this.tip.hide()
    },

    close() {
      this.tip.hide()
    }
  },
}
</script>
