<script setup>
import { ref, unref, watchEffect, computed } from 'vue'
import { useRoute } from 'vue-router'
import { isEqual } from 'lodash'
import { XMarkIcon, Cog6ToothIcon, PaperAirplaneIcon, PencilSquareIcon } from '@heroicons/vue/24/outline'
import Drawer from '@/components/Core/Drawer.vue'
import Button from '@/components/Core/Button.vue'
import useNodes from '@/composables/useNodes.js'

const emit = defineEmits(['closeNodeDrawer', 'nodeUpdated', 'nodeAdded', 'retryDiscovery'])
const { updateIngestingNode, addNodes, updateNode } = useNodes()

const isVisible = ref(false)
const editing = ref(false)
const form = ref({})
const isSaving = ref(false)
const isAdding = ref(false)

const props = defineProps({
  node: {
    type: Object,
    required: false
  },
  show: Boolean
})

const isIngestingNode = computed(() => props.node?.ingestState != undefined)
const isDiscoveringNode = computed(() => props.node?.ingestState != undefined && !['failed', 'pendingReview'].includes(props.node?.ingestState))
const isPendingReview = computed(() => props.node?.ingestState == 'pendingReview')
const isFormDirty = computed(() => {
 return !isEqual(form.value, hydrateForm())
})

watchEffect(() => {
  form.value = hydrateForm()
  editing.value = false
  isVisible.value = props.show
})

function hydrateForm() {
  return {
    id: props.node.id,
    serial: props.node.serial,
    chassisSerial: props.node.chassisSerial,
    ipmi: {
      ip: props.node.ipmi.ip,
      hostname: props.node.ipmi.hostname,
      gateway: props.node.ipmi.gateway,
      subnet: props.node.ipmi.subnet
    },
    host: {
      ip: props.node.host.ip,
      hostname: props.node.host.hostname,
      gateway: props.node.host.gateway,
      subnet: props.node.host.subnet
    },

    cvm: {
      ip: props.node.cvm.ip,
      hostname: props.node.cvm.hostname,
      gateway: props.node.cvm.gateway,
      subnet: props.node.cvm.subnet
    }
  }
}

async function addNode() {
  try {
    isAdding.value = true
    await addNodes([form.value])
    emit('nodeAdded')
  } catch(error) {
  } finally {
    isAdding.value = false
  }
}

function edit() {
  editing.value = !editing.value
}

async function save() {
  try {
    isSaving.value = true
    let nodeIdent
    if (isIngestingNode.value) {
      await updateIngestingNode(form.value)
      nodeIdent = unref(form.value.id)
    } else {
      await updateNode(form.value)
      nodeIdent = unref(form.value.serial)
    }
    emit('nodeUpdated', nodeIdent)
  } catch(error) {
  } finally {
    isSaving.value = false
  }
}

function retry() {
  emit('retryDiscovery', form.value.id)
}

function close() {
  isVisible.value = false
  emit('closeNodeDrawer')
}

function setSaveTippyContent(instance) {
  if (instance.reference.childNodes[0].disabled) {
    instance.setContent('No changes detected.')
  } else {
    instance.setContent('Save changes on node.')
  }
  return instance
}

</script>

<template>
  <Drawer v-model="isVisible">
    <!-- Content Begin -->
    <div class="flex flex-row justify-between px-2 mt-1 mb-1">
      <div class="flex flex-col font-medium leading-6">
        <p class="text-lg text-gray-900">{{ isIngestingNode ? 'Ingesting ' : '' }}Node Information</p>
        <p class="mt-1 max-w-2xl text-sm text-gray-500">Details about the {{ isIngestingNode ? 'ingesting ' : '' }}node.</p>
      </div>
      <div class="flex mt-1 space-x-1">
        <Button v-if="isPendingReview" v-tippy="{content: 'Adds node to inventory'}" kind="primary" @click="addNode" :loading="isAdding">
          <PaperAirplaneIcon class="hidden lg:block -ml-2 mr-2 w-5 h-5 shrink-0"/>
          Add
        </Button>
        <Transition mode="out-in">
          <Button v-if="!editing && (isPendingReview || !isIngestingNode)" @click="edit" :disabled="!isPendingReview && isIngestingNode">
            <PencilSquareIcon class="hidden lg:block -ml-2 w-5 h-5 shrink-0" />
            Edit
          </Button>
          <Button v-else-if="!isPendingReview && isIngestingNode" @click="retry" :disabled="isDiscoveringNode">
            <Cog6ToothIcon class="hidden lg:block -ml-2 mr-2 w-5 h-5 shrink-0"/>
            Retry
          </Button>
          <Button v-else v-tippy="{onShow: setSaveTippyContent }" name="saveBtn" @click="save" kind="primary" :loading="isSaving" :disabled="!isFormDirty">
            Save
          </Button>
        </Transition>
        <button @click="close">
          <XMarkIcon class="-mt-1.5 w-5 h-5 shrink-0" />
        </button>
      </div>
    </div>
    <div class="border-t border-gray-200 px-4 py-5 sm:p-0">
      <div class="sm:divide-y sm:divide-gray-200">
        <div class="py-4 sm:py-5 sm:px-4">
          <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the IPMI</p>

          <div class="px-2 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-col-2">
            <div class="sm:col-span-1">
              <label for="ipmiIP" class="pb-0 text-sm font-normal text-gray-500">IPMI IP</label><br />
              <input type="text" id="ipmiIP" v-model="form.ipmi.ip" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="ipmiHostname" class="pb-1 text-sm font-normal text-gray-500">IPMI Hostname</label><br />
              <input type="text" id="ipmiHostname" v-model="form.ipmi.hostname" :disabled="!editing"
                placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="ipmiSubnet" class="pb-1 text-sm font-normal text-gray-500">IPMI Subnet</label><br />
              <input type="text" id="ipmiSubnet" v-model="form.ipmi.subnet" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="ipmiGateway" class="pb-1 text-sm font-normal text-gray-500">IPMI Gateway</label><br />
              <input type="text" id="ipmiGateway" v-model="form.ipmi.gateway" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
          </div>
        </div>
        <div class="py-4 sm:py-5 sm:px-4">
          <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the Host</p>
          <div class="px-2 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-col-2">
            <div class="sm:col-span-1">
              <label for="hostIP" class="pb-0 text-sm font-normal text-gray-500">Host IP</label><br />
              <input type="text" id="hostIP" v-model="form.host.ip" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="hostHostname" class="pb-1 text-sm font-normal text-gray-500">Host Hostname</label><br />
              <input type="text" id="hostHostname" v-model="form.host.hostname" :disabled="!editing"
                placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="hostSubnet" class="pb-1 text-sm font-normal text-gray-500">Host Subnet</label><br />
              <input type="text" id="hostSubnet" v-model="form.host.subnet" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="hostGateway" class="pb-1 text-sm font-normal text-gray-500">Host Gateway</label><br />
              <input type="text" id="hostGateway" v-model="form.host.gateway" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
          </div>
        </div>
        <div class="py-4 sm:py-5 sm:px-4">
          <p class="max-w-2xl text-sm font-medium mb-1 text-gray-500 pb-1 ">Details about the CVM</p>
          <div class="px-2 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-col-2">
            <div class="sm:col-span-1">
              <label for="cvmIP" class="pb-0 text-sm font-normal text-gray-500">CVM IP</label><br />
              <input type="text" id="cvmIP" v-model="form.cvm.ip" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="cvmHostname" class="pb-1 text-sm font-normal text-gray-500">CVM Hostname</label><br />
              <input type="text" id="cvmHostname" v-model="form.cvm.hostname" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="cvmSubnet" class="pb-1 text-sm font-normal text-gray-500">CVM Subnet</label><br />
              <input type="text" id="cvmSubnet" v-model="form.cvm.subnet" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
            <div class="sm:col-span-1">
              <label for="cvmGateway" class="pb-1 text-sm font-normal text-gray-500">CVM Gateway</label><br />
              <input type="text" id="cvmGateway" v-model="form.cvm.gateway" :disabled="!editing" placeholder="10.1.1.1"
                class="relative -left-3 mt-2 text-sm text-gray-900 sm:col-span-1 sm:mt-0 rounded-md border disabled:border-0 disabled:pt-[.5625rem]  disabled:pl-[.8125rem] disabled:pb-[.5625rem]" />
            </div>
          </div>
        </div>
        <div v-if="isIngestingNode" class="py-4 sm:grid sm:grid-cols-8 sm:gap-4 sm:py-5 sm:px-6">
          <p class="max-w-2xl text-sm font-medium text-gray-500 col-span-8">Failure Reason</p>
          <p class="px-4 text-sm text-gray-900 sm:col-span-7 sm:mt-0">{{ node.failureReason || "No failures"}}</p>
        </div>
      </div>
    </div>
    <!-- Content End -->
  </Drawer>
</template>
