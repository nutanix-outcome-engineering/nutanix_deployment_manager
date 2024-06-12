<script setup>
import { ref, unref, watch, computed } from 'vue'
import { ArrowUpTrayIcon, XMarkIcon, PlusIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'
import { Combobox, Option, ComboboxButton } from '@/components/Core/Combobox'
import Dialog from '@/components/Core/Dialog.vue'
import Button from '@/components/Core/Button.vue'
import IpAddress from '@/components/Core/Form/IpAddress.vue'
import PasswordField from '@/components/Core/Form/PasswordField.vue'
import TextField from '@/components/Core/Form/TextField.vue'
import useSites from '@/composables/useSites.js'
import useFoundation from '@/composables/useFoundation.js'

const emit = defineEmits(['newFVM'])

const { sites, getSites } = useSites()
const { addFoundationServer } = useFoundation()
const form = ref({})
const isVisible = ref(false)

function formDefault() {
  return {
    foundation: {
      ip: '',
      credentials: {
        username: '',
        password: ''
      }
    },
    site: {}
  }
}

function hydrateForm() {
  let form = formDefault()

  return form
}

watch( isVisible, () => {
  if (isVisible.value) {
    form.value = hydrateForm()
  }
})

async function handleSubmit() {
  try {
    let newFVM = await addFoundationServer(unref(form.value.site), unref(form.value.foundation))
    isVisible.value = false
    form.value = formDefault()
    emit('newFVM', newFVM)
  } catch (err) {
    console.error(err)
  }
}
getSites()
</script>

<template>
  <Dialog v-model="isVisible" :heading="'Add Foundation Server'">
    <template #activator="{ open }">
      <div @click="open">
        <slot>
        <!-- Default Slot content, replaced if there is other content -->
          <Button>
              <ArrowUpTrayIcon class="-ml-2 mr-2 w-5 h-5 shrink-0" />
              <span>Add Foundation Server</span>
          </Button>
        </slot>
      </div>
    </template>
    <form class="flex flex-col space-y-2">
      <Combobox v-model="form.site" label="Site">
        <Option v-for="site in sites" :key="site.id" :value="site">{{ site.name }}</Option>
      </Combobox>
      <IpAddress v-model="form.foundation.ip" label="IP/FQDN" required/>
      <TextField label="Username" v-model="form.foundation.credentials.username" placeholder="nutanix" required/>
      <PasswordField label="Password" v-model="form.foundation.credentials.password" placeholder="nutanix/4u" required/>

      <div class="pt-2 pb-2 flex justify-end">
        <Button kind="primary" @click="handleSubmit()" >Submit</Button>
      </div>
    </form>

  </Dialog>
</template>
