<template>
  <div class="w-full space-y-1">
    <label v-if="label" :for="id" class="flex justify-between text-sm font-medium leading-5 text-gray-700">
      <span>{{ label }}</span>
      <span v-if="required" class="text-red-600 text-xs">Required</span>
    </label>
    <div class="relative mt-1">
      <input
        ref="input"
        :id="id"
        type="text"
        name="ip"
        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md placeholder-gray-300"
        :placeholder="placeholder"
        :aria-required="required"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>
  </div>
</template>

<script>
import maskInput from 'vanilla-text-mask'

let id = 0

function generateId() {
  return `ip-address-field-id-${++id}`
}

export default {
  name: 'IpAddress',

  props: {
    modelValue: String,
    label: String,
    required: Boolean,
    loading: Boolean,
    placeholder: {
      type: String,
      default: '10.0.0.0'
    }
  },

  data() {
    return {
      id: generateId()
    }
  },

  mounted() {
    const el = this.$refs.input
    //BUG: This mask does not work
    el._inputMask = maskInput({
      inputElement: el,
      mask: (value, data) => {
        const mask = Array(value.length).fill(/[\d.]/)
        const chunks = value.split('.');

        for (let i = 0; i < 4; ++i) {
          const chunk = (chunks[i] || "");

          if (255 % +chunk === 255) {
            mask[value.length - 1] = '.';
            mask[value.length] = /[\d.]/;
          }
        }

        return mask;
      },
      pipe: (value) => {
        if (value === "." || value.endsWith("..")) return false;

        const parts = value.split(".");

        if (
          parts.length > 4 ||
          parts.some(part => part === "00" || part < 0 || part > 255)
        ) {
          return false;
        }

        return value;
      },
      guide: true
    })
  },

  beforeUnmount() {
    const el = this.$refs.input

    if (el._inputMask) {
      el._inputMask.destroy()
    }
  }
}
</script>
