<template>
  <div>
    <label v-if="label" :for="id" class="flex justify-between items-end text-sm font-medium leading-5 text-gray-700">
      <span>{{ label }}</span>
      <span v-if="required" class="text-red-600 text-xs">Required</span>
    </label>
    <div class="mt-1 relative rounded-md shadow-sm">
      <input
        :id="id"
        :type="showPassword ? 'text' : 'password'"
        v-model="password"
        class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md placeholder-gray-300"
        :class="[{ base: 'sm:text-sm', lg: 'py-2 px-3'}[size]]"
        :placeholder="placeholder"
        data-lpignore="true"
        autocomplete="off"
      >
      <div class="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
        <ShieldCheckIcon
          v-if="rules.length > 0"
          class="h-5 w-5"
          :class="[meetsRequirementsClass]"
          :content="failedRequirementsHtml"
          @show="() => !meetsRequirements()"
          v-tippy="{ allowHTML: true }"
        />
        <button
          :content="showPassword ? 'Hide password' : 'Show password'" v-tippy
          @click.prevent="showPassword = !showPassword"
          class="focus:outline-none cursor-pointer"
        >
          <EyeIcon v-if="showPassword" class="h-5 w-5 text-gray-400" />
          <EyeSlashIcon v-else class="h-5 w-5 text-gray-400" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ShieldCheckIcon, EyeSlashIcon, EyeIcon } from '@heroicons/vue/24/solid'

let id = 0

function generateId() {
  return `password-field-id-${++id}`
}

export default {
  name: 'PasswordField',

  components: { ShieldCheckIcon, EyeSlashIcon, EyeIcon },

  props: {
    label: String,
    modelValue: {
      type: String,
      default: ''
    },
    required: Boolean,
    valid: Boolean,
    placeholder: String,
    size: {
      type: String,
      validator: val => ['base', 'lg'].includes(val),
      default: 'base'
    },
    rules: {
      type: Array,
      validator: rules => rules.every(rule => rule.regex instanceof RegExp),
      default: () => [],
    }
  },

  data() {
    return {
      id: generateId(),
      showPassword: false
    }
  },

  watch: {
    modelValue(val) {
      this.$emit('update:valid', this.meetsRequirements(val))
    }
  },

  computed: {
    password: {
      get() {
        return this.modelValue
      },

      set(password) {
        this.$emit('update:modelValue', password)
      }
    },

    meetsRequirementsClass() {
      if (!this.modelValue || this.modelValue.length === 0) {
        return 'text-gray-400'
      }

      if (this.meetsRequirements()) {
        return 'text-green-400'
      }

      return 'text-red-400'
    },

    failedRequirementsHtml() {
      const errors = this.rules
        .filter(rule => rule.regex.test(this.modelValue) === false)
        .map(rule => `<li>${rule.message}</li>`)

      return `<ul class="ml-4 list-disc text-left">${errors.join('')}</ul>`
    }
  },

  methods: {
    meetsRequirements() {
      if (this.rules.length === 0) {
        return true
      }

      return this.rules.every(rule => rule.regex.test(this.modelValue))
    }
  }
}
</script>
