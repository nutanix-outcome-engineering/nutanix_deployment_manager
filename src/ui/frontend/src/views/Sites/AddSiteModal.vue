<script setup>
import { ref, unref, watch } from 'vue'
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import Dialog from '@/components/Core/Dialog.vue'
import Button from '@/components/Core/Button.vue'
import TextList from '@/components/Core/Form/TextList.vue'

const emit = defineEmits(['handleSubmit'])

const isVisible = ref(false)
const form = ref({})

const props = defineProps({
  site: {
    type: Object,
    required: false
  }
})

function formDefault() {
  return {
    site:{
      name: '',
      infraCluster: undefined,
      ntpServers: [],
      dnsServers: []
    }
  }
}

function hydrateForm() {
  if(props.site) {
    return {
      site:{
        id: props.site.id,
        name: props.site.name,
        infraCluster: props.site.infraCluster,
        ntpServers: [...props.site.ntpServers],
        dnsServers: [...props.site.dnsServers]
      }
    }
  }
  else {
    return formDefault()
  }
}

watch( isVisible, () => {
  if(isVisible.value) {
    form.value = hydrateForm()
  }
})

function handleSubmit() {
    emit('handleSubmit', unref(form.value.site))

  form.value = formDefault()
  isVisible.value = false
}
</script>

<template>
  <Dialog v-model="isVisible" :heading="site ? 'Edit Site' : 'Add Site'">
    <template #activator="{ open }">
      <div @click="open">
    <slot>
    <!-- Default Slot content, replaced if there is other content -->
      <Button>
          <ArrowUpTrayIcon class="-ml-2 mr-2 w-5 h-5 shrink-0" />
          <span>Add Site</span>
      </Button>
    </slot>
    </div>
    </template>

    <div class="">
      <form class="pb-2">
        <div class="flex flex-1 flex-col">
          <span class="pt-2 pb-2 text-sm font-medium leading-6 text-gray-700">Site Name</span>
          <input type="text" id="name" class=" pt-2 pb-2 text-sm text-gray-700" v-model="form.site.name" placeholder="mySiteName" label="Name" v-on:keydown.enter.prevent/>
          <TextList label="NTP Servers" class="pt-2 pb-2" placeholder="x.x.x.x" hint="Enter an NTP server" v-model="form.site.ntpServers" />
          <TextList label="DNS Servers" class="pt-2 pb-2" placeholder="x.x.x.x" hint="Enter a DNS server" v-model="form.site.dnsServers" />
          <div class="pt-2 pb-2 flex justify-end">
            <Button kind="primary" @click="handleSubmit()" >{{site? 'Edit Site' : 'Add Site'}}</Button>
          </div>
        </div>
      </form>
    </div>
  </Dialog>
</template>
