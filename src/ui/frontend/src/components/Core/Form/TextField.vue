<template>
  <div>
    <label v-if="label" :for="id" class="flex justify-between items-end text-sm font-medium leading-5 text-gray-700">
      <span>{{ label }}</span>
      <span v-if="required" class="text-red-600 text-xs">Required</span>
    </label>

    <div class="relative mt-1">
      <input
        v-bind="$attrs"
        :id="id"
        :type="type"
        :value="modelValue"
        @input="debounceInput"
        :required="required"
        :aria-required="required"
        :placeholder="placeholder"
        :disabled="disabled"
        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md placeholder-gray-300"
        :class="[{ base: 'sm:text-sm', lg: 'py-2 px-3'}[size], disabled ? 'opacity-50 cursor-not-allowed' : '']"
        autocomplete="off"
      />
      <div class="absolute inset-y-0 right-3 inline-flex items-center">
        <Loader v-if="loading" :size="16" color="#ccc" />
        <template v-if="!loading && valid !== undefined">
          <CheckIcon v-if="valid" class="flex-shrink-0 w-5 h-5 text-green-600"/>
          <XMarkIcon v-else class="flex-shrink-0 w-5 h-5 text-red-600"/>
        </template>

      </div>
    </div>

    <p v-if="hint" class="mt-2 text-sm leading-5 text-gray-500">
      {{ hint }}
    </p>
  </div>
</template>

<script>
import Loader from '@/components/Core/Loader.vue'
import { XMarkIcon, CheckIcon } from '@heroicons/vue/24/outline'

let id = 0

function generateId() {
  return `rx-text-field-id-${++id}`
}

export default {
  name: 'TextField',

  inheritAttrs: false,

  components: { XMarkIcon, CheckIcon, Loader },

  props: {
    modelValue: String | Number,
    label: String,
    hint: String,
    type: {
      type: String,
      default: 'text'
    },
    placeholder: String,
    required: Boolean,
    loading: Boolean,
    valid: {
      type: [Boolean, String],
      default: undefined
    },
    debounce: {
      type: Number,
      default: 0
    },
    size: {
      type: String,
      validator: val => ['base', 'lg'].includes(val),
      default: 'base'
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      id: this.$attrs.id || generateId()
    }
  },

  methods: {
    debounceInput(event) {
      if (this.bounce) {
        clearTimeout(this.bounce)
      }

      this.bounce = setTimeout(() => {
        this.$emit('update:modelValue', event.target.value)
      }, this.debounce)
    },
  }
}
</script>
