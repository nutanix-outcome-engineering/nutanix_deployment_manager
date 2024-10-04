<template>
  <div class="bg-gray-100 rounded-md">
    <label v-if="label" :for="id" class="block text-sm font-medium text-gray-700">{{ label }}</label>
    <form @submit="addItem" class="mt-1 flex rounded-md shadow-sm">
      <div class="relative flex items-stretch flex-grow focus-within:z-10">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <ClipboardDocumentListIcon outline class="h-5 w-5 text-gray-400" />
        </div>
        <input type="text" v-model="form.text" :placeholder="placeholder" :id="id" class="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300">
        <div v-if="form.text.length > 0" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none" >
        <template v-if="isValid">
        <CheckIcon outline class="h-5 w-5 text-green-400"></CheckIcon>
        </template>
        <template v-else>
        <XMarkIcon outline class="h-5 w-5 text-red-400"></XMarkIcon>
        </template>
        </div>
      </div>
      <button class="-ml-px relative inline-flex items-center space-x-2 px-2 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
        <PlusIcon class="ml-1 w-5 h-5 text-gray-700" />
      </button>
    </form>
    <div class="p-2 mt-2 flex flex-wrap max-h-40 bg-gray-50 rounded-lg border overflow-y-scroll">
      <button
        v-for="item in items"
        @click="remove(item)"
        :key="item"
        class="mr-1 flex items-center rounded-full py-1 px-3 space-x-2 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-200 active:bg-red-100"
      >
        <p class="text-gray-800 text-xs">{{ item }}</p>
        <XMarkIcon outline class="text-red-500 flex-shrink-0 w-4 h-4" />
      </button>
      <button
      v-if="form.text.length && this.items.indexOf(this.form.text) === -1"
        @click="form.text = ''"
        class="mr-1 flex items-center rounded-full py-1 px-3 space-x-2 bg-white border border-gray-300 hover:bg-red-50 hover:border-red-200 active:bg-red-100"
      >
        <p class="text-gray-800 text-xs">{{ form.text }}</p>
        <XMarkIcon outline class="text-red-500 flex-shrink-0 w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<script>
import { CheckIcon, ClipboardDocumentListIcon, XMarkIcon, PlusIcon } from '@heroicons/vue/24/solid'
export default {
  name: 'TextList',
  components: { CheckIcon, ClipboardDocumentListIcon, XMarkIcon, PlusIcon },

  props: {
    modelValue: Array,
    label: String,
    hint: String,
    placeholder: String,
    id: String,
    validator: {
      type: Function,
      default: val => val.length > 0
    }
  },

  watch: {
    modelValue: {
      handler: function (val) {
        if (!this.form.text.length) {
          this.items = val
        }
      },
      deep: true,
      immediate: true
    },
    "form.text": function (val) {
      if(val.length) {
        this.$emit('update:modelValue', [...this.items, val])
      }
    }
  },

  data() {
    return {
      form: {
        text: ''
      },
      items: []
    }
  },

  computed: {
    isValid() {
      return this.validator(this.form.text)
    }
  },

  methods: {
    addItem(e) {
      e.stopPropagation()
      e.preventDefault()

      if (!this.isValid) {
        return
      }

      // Only add if item is not already in the list
      if (this.items.indexOf(this.form.text) === -1) {
        this.items.push(this.form.text)
      }

      this.form.text = ''
    },

    remove(item) {
      this.items = this.items.filter(i => i !== item)
      this.$emit('update:modelValue', this.items)
    }
  }
}
</script>
