<script setup>
import { ref, unref, watch, computed } from 'vue'
import { ArrowUpTrayIcon, XMarkIcon, PlusIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { Combobox, Option, ComboboxButton } from '@/components/Core/Combobox'
import Dialog from '@/components/Core/Dialog.vue'
import Button from '@/components/Core/Button.vue'
import useSites from '@/composables/useSites.js'
import useTus from '@/composables/useTus.js'

const { addAOS, updateAOS } = useSites()
const { uploadAos } = useTus()
const form = ref({})
const isVisible = ref(false)

const props = defineProps({
  aos: {
    type: Object,
    required: false
  },
  site: {
    type: Object,
    required: true
  }
})

function formDefault() {
  return {
    name: '',
    version: '',
    status: '',
    file: null
  }
}

function hydrateForm() {
  let form = formDefault()

  if (props.aos) {
    form = {
      name: props.aos.name,
      version: props.aos.version,
      status: props.aos.status
    }
  }

  return form
}

watch( isVisible, () => {
  if (isVisible.value) {
    form.value = hydrateForm()
  }
})

async function handleSubmit() {
  let aos = null
  if (!props.aos) {
    aos = await addAOS(props.site, {
      name: form.value.name,
      version: form.value.version,
      status: form.value.status
    })
  } else {
    aos = await updateAOS(props.site, {
      uuid: props.aos.uuid,
      name: form.value.name,
      version: form.value.version,
      status: form.value.status
    })
  }
  if (form.value.file) {
    uploadAos(form.value.file, aos.uuid)
  }
  isVisible.value = false
  form.value = formDefault()
}
async function fileChanged(event) {
  form.value.file = event.target.files[0]
}
</script>

<template>
  <Dialog v-model="isVisible" :heading="aos ? 'Edit AOS' : 'Add AOS'">
    <template #activator="{ open }">
      <div @click="open">
        <slot>
        <!-- Default Slot content, replaced if there is other content -->
          <Button>
              <ArrowUpTrayIcon class="-ml-2 mr-2 w-5 h-5 shrink-0" />
              <span>Add AOS</span>
          </Button>
        </slot>
      </div>
    </template>
    <form class="flex flex-col space-y-2">
      <label for="name" class="mr-2">Name:</label>
      <input class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 w-full rounded-md sm:text-sm border-gray-300"
        v-model="form.name" type="text" id="name" placeholder="Display Name"/>


      <label for="version" class="mr-2">Version:</label>
      <input class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 w-full rounded-md sm:text-sm border-gray-300"
        v-model="form.version" type="text" id="version" placeholder="Version"/>

      <Combobox v-model="form.status" label="Status">
        <Option value="certified">Certified</Option>
        <Option value="inCertification">In Certification</Option>
        <Option value="deprecated">Deprecated</Option>
      </Combobox>

      <label for="file" class="mr-2">AOS Package:</label>
      <input class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 w-full rounded-md sm:text-sm border-gray-300"
        @change="fileChanged" type="file" id="file" placeholder="Version"
        accept="application/gzip,application/x-tar,application/x-gzip"/>

      <div class="pt-2 pb-2 flex justify-end">
        <Button kind="primary" @click="handleSubmit()" >{{aos? 'Edit AOS' : 'Add AOS'}}</Button>
      </div>
    </form>

  </Dialog>
</template>
