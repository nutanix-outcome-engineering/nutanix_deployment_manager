<script setup>
import { ref, unref, reactive, computed } from 'vue'
import { ArrowUpTrayIcon } from '@heroicons/vue/24/outline'
import Dialog from '@/components/Core/Dialog.vue'
import Button from '@/components/Core/Button.vue'
import IpAddress from '@/components/Core/Form/IpAddress.vue'

const emit = defineEmits(['ingestByRange'])

const isVisible = ref(false)
const form = ref(formDefault())

function formDefault() {
  return {
    ip: {
      range: {
        start:'',
        stop: ''
      }
    }
  }
}

function ingest(by) {
  if (by == 'byRange') {
    emit('ingestByRange', unref(form.value.ip.range))
  }

  form.value = formDefault()
  isVisible.value = false
}

const canIngestByRange = computed(() => { return Boolean(form.value.ip.range.start && form.value.ip.range.stop) })
</script>

<template>
  <Dialog v-model="isVisible" heading="Ingest Nodes">
    <template #activator="{ open }">
      <Button @click="open" >
        <ArrowUpTrayIcon class="-ml-2 mr-2 w-5 h-5 shrink-0" />
        <span>Import Nodes</span>
      </Button>
    </template>

    <div class="">
      <form class="pb-2">
        <div class="">
          <span class="pt-2 pb-2 text-lg font-medium leading-6 text-gray-900">Ingest By IP Range</span>
          <IpAddress class="pt-2 pb-2 text-gray-900" v-model="form.ip.range.start" placeholder="x.x.x.x" label="Start IP" required/>
          <IpAddress class="pt-2 pb-2 text-gray-900" v-model="form.ip.range.stop"  placeholder="x.x.x.x" label="Stop IP"  required/>
          <div class="flex justify-end">
            <Button kind="primary" @click="ingest('byRange')" :disabled="!canIngestByRange">Ingest By Range</Button>
          </div>
        </div>
      </form>
    </div>
  </Dialog>
</template>
