<script setup>
import { ref, unref, watch, computed } from 'vue'
import { ArrowUpTrayIcon, XMarkIcon, PlusIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/vue/24/outline'
import { startCase } from 'lodash'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import AOSModal from './AOSModal.vue'
import HypervisorModal from './HypervisorModal.vue'
import Button from '@/components/Core/Button.vue'
import Badge from '@/components/Core/Badge.vue'
import TextList from '@/components/Core/Form/TextList.vue'
import PasswordField from '@/components/Core/Form/PasswordField.vue'
import { Combobox, Option } from '@/components/Core/Combobox'
import useSites from '@/composables/useSites.js'

const { sites, getSite, site, editSite } = useSites()
const route = useRoute()

const form = ref({})

//Nested form element refs
const pcForm = ref(null)
const pcDisplayNameField = ref(null)
const pcIPField = ref(null)
const vCenterForm = ref(null)
const vCenterDisplayNameField = ref(null)
const vCenterIPField = ref(null)
const isLoading = ref(true)

function formDefault() {
  return {
    site: {
      name: '',
      infraCluster: undefined,
      ntpServers: [],
      dnsServers: [],
      pcServers: [],
      vCenterServers: [],
      aosList: [],
      hypervisorList: [],
      prism: {
        certificate: '',
        caChain: '',
        key: ''
      },
      lcmDarksiteUrl: '',
      smtp: {
        address: '',
        fromAddress: '',
        port: '',
        securityMode: '',
        credentials: {
          username: '',
          password: ''
        }
      },
      ldap: {
        directoryName: '',
        directoryUrl: '',
        credentials: {
          username: '',
          password: ''
        },
        adminRoleGroupMapping: []
      }
    },
    pc: {
      displayName: '',
      hostnameOrIP: '',
      default: false,
      credentials: {
        username: '',
        password: ''
      },
      idx: null
    },
    vCenter: {
      displayName: '',
      hostnameOrIP: '',
      default: false,
      credentials: {
        username: '',
        password: ''
      },
      idx: null
    },
    smtp: {
      templateString: '',
      domain: ''
    }
  }
}

function hydrateForm() {
  let form = formDefault()
  if(site.value) {
    form.site = {
      id: site.value.id,
      name: site.value.name,
      infraCluster: site.value.infraCluster,
      ntpServers: [...site.value.ntpServers],
      dnsServers: [...site.value.dnsServers],
      pcServers: [...site.value.pcServers],
      vCenterServers: [...site.value.vCenterServers],
      aosList: [...site.value.aosList],
      hypervisorList: [...site.value.hypervisorList],
      lcmDarksiteUrl: site.value.lcmDarksiteUrl,
      prism: site.value.prism || form.site.prism,
      smtp: site.value.smtp,
      ldap: site.value.ldap
    }
    form.smtp.templateString = site.value.smtp.fromTemplate
    form.smtp.domain = site.value.smtp.fromDomain
  }
  return form
}

const certsProvided = computed(() => {
  return site.value.prism.certificate && site.value.prism.caChain
})

watch(() => route.params.id, async () => {
  await getSite(route.params.id)
  form.value = hydrateForm()
  isLoading.value = false
  }, { immediate: true }
)

watch(site, async () => {
  form.value = hydrateForm()
}, { immediate: true })

watch(() => form.value.smtp, () => {
    form.value.site.smtp.fromAddress = `${form.value.smtp.templateString}@${form.value.smtp.domain}`
  }, { deep: true },
)

async function handleSubmit() {
  await editSite(unref(form.value.site))
}

// PC function start
function editPC(pc, idx) {
  form.value.pc = {
    displayName: pc.displayName,
    hostnameOrIP: pc.hostnameOrIP,
    default: pc.default,
    credentials: {
      username: pc.credentials?.username,
      password: pc.credentials?.password
    },
    idx: idx
  }
  isPCFormValid()
}

function removePC(pc, idx) {
  form.value.site.pcServers.splice(idx, 1)
}

function addPC(event) {
  event.stopPropagation()
  event.preventDefault()
  const idx = form.value.pc.idx
  if (isPCFormValid()) {
    if (form.value.pc.default == true) {
      let currentDefaultIdx = form.value.site.pcServers.findIndex(pc => pc.default == true)
      if (currentDefaultIdx > -1) {
        form.value.site.pcServers[currentDefaultIdx].default = false
      }
    }
    if (idx != null && idx != undefined && idx >= 0) {
      form.value.site.pcServers[idx].displayName = form.value.pc.displayName
      form.value.site.pcServers[idx].hostnameOrIP = form.value.pc.hostnameOrIP
      form.value.site.pcServers[idx].default = form.value.pc.default
      form.value.site.pcServers[idx].credentials.username = form.value.pc.credentials.username
      form.value.site.pcServers[idx].credentials.password = form.value.pc.credentials.password
    } else {
      form.value.site.pcServers.push(form.value.pc)
    }
    resetPCForm()
  }
}

function resetPCForm() {
  form.value.pc = {
    displayName: '',
    hostnameOrIP: '',
    default: false,
    credentials: {
      username: '',
      password: ''
    },
    idx: null
  }
  isPCFormValid()
}

function isPCFormValid() {
  const idx = form.value.pc.idx
  const displayNameExists = form.value.site.pcServers.findIndex(pc => pc.displayName == form.value.pc.displayName)
  const hostnameOrIPExists = form.value.site.pcServers.findIndex(pc => pc.hostnameOrIP == form.value.pc.hostnameOrIP)
  let hasDisplayName = form.value.pc.displayName.length > 0
  let hasHostnameOrIP = form.value.pc.hostnameOrIP.length > 0
  let hasCredentials = form.value.pc.credentials.username.length > 0 && form.value.pc.credentials.password.length
  let isValid = false

  if (isPCAlreadyInDB) {
    isValid = hasDisplayName && hasHostnameOrIP
  } else {
    isValid = hasDisplayName && hasHostnameOrIP && hasCredentials
  }

  if (displayNameExists >= 0 && idx != displayNameExists) {
    pcDisplayNameField.value.setCustomValidity(`${form.value.pc.displayName} already exists for site.`)
    isValid = false
  } else {
    pcDisplayNameField.value.setCustomValidity("")
  }
  if (hostnameOrIPExists >= 0 && idx != hostnameOrIPExists) {
    pcIPField.value.setCustomValidity(`${form.value.pc.hostnameOrIP} already exists for site.`)
    isValid = false
  } else {
    pcIPField.value.setCustomValidity("")
  }

  return isValid
}

const isPCAlreadyInDB = computed(() => {
  return Boolean(form.value.site.pcServers[form.value.pc.idx]?.id)
})
//PC function end
//vCenter functions start
function editvCenter(vCenter, idx) {
  form.value.vCenter = {
    displayName: vCenter.displayName,
    hostnameOrIP: vCenter.hostnameOrIP,
    default: vCenter.default,
    credentials: {
      username: vCenter.credentials?.username,
      password: vCenter.credentials?.password
    },
    idx: idx
  }
  isvCenterFormValid()
}

function removevCenter(vCenter, idx) {
  form.value.site.vCenterServers.splice(idx, 1)
}

function addvCenter(event) {
  event.stopPropagation()
  event.preventDefault()
  const idx = form.value.vCenter.idx
  if(isvCenterFormValid()) {
    if (form.value.vCenter.default == true) {
      let currentDefaultIdx = form.value.site.vCenterServers.findIndex(vcsa => vcsa.default == true)
      if (currentDefaultIdx > -1) {
        form.value.site.vCenterServers[currentDefaultIdx].default = false
      }
    }
    if (idx != null && idx != undefined && idx >= 0) {
      form.value.site.vCenterServers[idx].displayName = form.value.vCenter.displayName
      form.value.site.vCenterServers[idx].hostnameOrIP = form.value.vCenter.hostnameOrIP
      form.value.site.vCenterServers[idx].default = form.value.vCenter.default
      form.value.site.vCenterServers[idx].credentials.username = form.value.vCenter.credentials.username
      form.value.site.vCenterServers[idx].credentials.password = form.value.vCenter.credentials.password
    } else {
      form.value.site.vCenterServers.push(form.value.vCenter)
    }
    resetvCenterForm()
  }
}

function resetvCenterForm() {
  form.value.vCenter = {
    displayName: '',
    hostnameOrIP: '',
    default: false,
    credentials: {
      username: '',
      password: ''
    }
  }
  isvCenterFormValid()
}

function isvCenterFormValid() {
  const idx = form.value.vCenter.idx
  const displayNameExists = form.value.site.vCenterServers.findIndex(vcsa => vcsa.displayName == form.value.vCenter.displayName)
  const hostnameOrIPExists = form.value.site.vCenterServers.findIndex(vcsa => vcsa.hostnameOrIP == form.value.vCenter.hostnameOrIP)
  let hasDisplayName = form.value.vCenter.displayName.length > 0
  let hasHostnameOrIP = form.value.vCenter.hostnameOrIP.length > 0
  let hasCredentials = form.value.vCenter.credentials.username.length > 0 && form.value.vCenter.credentials.password.length
  let isValid = false

  if (isvCenterAlreadyInDB) {
    isValid = hasDisplayName && hasHostnameOrIP
  } else {
    isValid = hasDisplayName && hasHostnameOrIP && hasCredentials
  }

  if (displayNameExists >= 0 && idx != displayNameExists) {
    vCenterDisplayNameField.value.setCustomValidity(`${form.value.vCenter.displayName} already exists for site.`)
    isValid = false
  } else {
    vCenterDisplayNameField.value.setCustomValidity("")
  }
  if (hostnameOrIPExists >= 0 && idx != hostnameOrIPExists) {
    vCenterIPField.value.setCustomValidity(`${form.value.vCenter.hostnameOrIP} already exists for site.`)
    isValid = false
  } else {
    vCenterIPField.value.setCustomValidity("")
  }

  return isValid
}

const isvCenterAlreadyInDB = computed(() => {
  return Boolean(form.value.site.vCenterServers[form.value.vCenter.idx]?.id)
})
//vCenter functions end

function transferStatusColor(status) {
  let color = 'white'
  switch (status) {
    case 'uploading':
      color = 'yellow'
      break;
    case 'uploaded':
      color = 'green'
      break;
    case 'failed':
      color = 'red'
      break;
  }

  return color
}
function statusColor(status) {
  let color = 'white'
  switch (status) {
    case 'inCertification':
      color = 'yellow'
      break;
    case 'certified':
      color = 'green'
      break;
    case 'deprecated':
      color = 'red'
      break;
  }

  return color
}

async function fileChanged(file) {
  return await file.text()
}

async function certificateFileChanged(event) {
  form.value.site.prism.certificate = await fileChanged(event.target.files[0])
}
async function caChainFileChanged(event) {
  form.value.site.prism.caChain = await fileChanged(event.target.files[0])
}
async function keyFileChanged(event) {
  form.value.site.prism.key = await fileChanged(event.target.files[0])
}
</script>

<template>
  <template v-if="!isLoading">
    <form class="m-2">
    <div class="flex flex-1 flex-col">
      <div class="flex flex-1 flex-row py-2 justify-between">
        <h2 class="text-lg font-medium">Modify Site</h2>
        <div class="flex space-x-2">
          <Button kind="primary" @click="handleSubmit()" >{{site? 'Edit Site' : 'Add Site'}}</Button>
        </div>

      </div>
      <label for="name" class="pt-2 pb-2 text-base font-medium leading-6 text-gray-700">Site Name</label>
      <input type="text" id="name" class="pt-2 pb-2 text-base text-gray-700 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md  border-gray-300" v-model="form.site.name" placeholder="mySiteName" label="Name" v-on:keydown.enter.prevent/>

      <div class="grid grid-cols-2 mt-2 gap-2">
        <TextList label="NTP Servers" class="pt-2 pb-2 px-2 col-span-1" placeholder="x.x.x.x" hint="Enter an NTP server" v-model="form.site.ntpServers" />
        <TextList label="DNS Servers" class="pt-2 pb-2 px-2 col-span-1" placeholder="x.x.x.x" hint="Enter a DNS server" v-model="form.site.dnsServers" />
        <!-- PC Servers Start -->
        <div class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium">
          <span class="block pt-2 pb-2 text-sm font-medium">Prism Central Servers</span>
          <form ref="pcForm" class="grid grid-flow-rows items-center gap-y-1 gap-x-1" @submit="addPC" @input="isPCFormValid">
            <label for="pcDisplayName" class="mr-2">Display Name:</label>
            <input
              type="text"
              ref="pcDisplayNameField"
              id="pcDisplayName"
              :required="form.pc.hostnameOrIP.length > 0"
              placeholder="Display Name"
              v-model="form.pc.displayName"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="pcIP" class="mr-2">Hostname or IP:</label>
            <input
              type="text"
              ref="pcIPField"
              id="pcIP"
              :required="form.pc.displayName.length > 0"
              placeholder="FQDN or x.x.x.x"
              v-model="form.pc.hostnameOrIP"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
              />
            <label for="pcUsername" class="mr-2">Username:</label>
            <input
              type="text"
              :required="!isPCAlreadyInDB && form.pc.displayName.length > 0"
              id="pcUsername"
              placeholder="Username"
              v-model="form.pc.credentials.username"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="pcPassword" class="mr-2">Password:</label>
            <PasswordField
              type="text"
              :required="!isPCAlreadyInDB && form.pc.displayName.length > 0"
              id="pcPassword"
              placeholder="Password"
              v-model="form.pc.credentials.password"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="siteDefaultPC" class="mr-2">Default:</label>
            <input
              type="checkbox"
              id="siteDefaultPC"
              placeholder="x.x.x.x"
              v-model="form.pc.default"
              class="required:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block rounded-md sm:text-sm border-gray-300"
            />
            <button type="reset" @click="resetPCForm" class="inline-flex shrink items-center py-2 border  text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <ArrowPathIcon class="w-5 h-5 ml-1 shrink-0 text-gray-700"/>
              <span class="pl-2">Clear</span>
            </button>
            <button type="submit"
              :disabled="form.pc.displayName.length == 0"
              class="disabled:cursor-not-allowed disabled:opacity-50 col-start-2 inline-flex shrink items-center py-2 border  text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <PlusIcon class="w-5 h-5 ml-1 shrink text-gray-700" />
              <span class="pl-2">{{ form.pc.idx != null && form.pc.idx != undefined && form.pc.idx >= 0 ? 'Save Changes' : 'Add Prism Central'}}</span>
            </button>
          </form>
          <div class="p-2 mt-2 flex flex-wrap max-h-40 bg-gray-50 rounded-lg border overflow-y-scroll space-x-2">
            <div class="inline-flex items-center content-center rounded-full bg-white space-x-2 px-2" v-for="(pc, idx) in form.site.pcServers" :key="pc.hostnameOrIP"
                :class="{'border-2 border-gray-500': pc.default, 'border border-gray-300': !pc.default}"
              >
              <button @click.stop.prevent="editPC(pc, idx)" class="pb-1 hover:bg-blue-100" >
                <span class="text-gray-800 text-xs">{{ pc.displayName }}</span>
              </button>
              <button @click.stop.prevent="removePC(pc, idx)" class="hover:bg-red-100">
                <XMarkIcon outline class="text-red-500 flex-shrink-0 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <!-- PC Servers End-->
        <!-- VCSA Servers Start -->
        <div class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium">
          <span class="block pt-2 pb-2 text-sm font-medium">vCenter Servers</span>
          <form ref="vCenterForm" class="grid grid-flow-rows items-center gap-y-1 gap-x-1" @submit="addvCenter" @input="isvCenterFormValid">
            <label for="vCenterDisplayName" class="mr-2">Display Name:</label>
            <input
              type="text"
              ref="vCenterDisplayNameField"
              id="vCenterDisplayName"
              :required="form.vCenter.hostnameOrIP.length > 0"
              placeholder="Display Name"
              v-model="form.vCenter.displayName"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="vCenterIP" class="mr-2">Hostname or IP:</label>
            <input
              type="text"
              ref="vCenterIPField"
              id="vCenterIP"
              :required="form.vCenter.displayName.length > 0"
              placeholder="FQDN or x.x.x.x"
              v-model="form.vCenter.hostnameOrIP"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
              />
            <label for="vCenterUsername" class="mr-2">Username:</label>
            <input
              type="text"
              :required="!isvCenterAlreadyInDB && form.vCenter.displayName.length > 0"
              id="vCenterUsername"
              placeholder="Username"
              v-model="form.vCenter.credentials.username"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="vCenterPassword" class="mr-2">Password:</label>
            <PasswordField
              type="text"
              :required="!isvCenterAlreadyInDB && form.vCenter.displayName.length > 0"
              id="vCenterPassword"
              placeholder="Password"
              v-model="form.vCenter.credentials.password"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="siteDefaultvCenter" class="mr-2">Default:</label>
            <input
              type="checkbox"
              id="siteDefaultvCenter"
              v-model="form.vCenter.default"
              class="required:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block rounded-md sm:text-sm border-gray-300"
            />
            <button type="reset" @click="resetvCenterForm" class="inline-flex shrink items-center py-2 border  text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <ArrowPathIcon class="w-5 h-5 ml-2 shrink-0 text-gray-700"/>
              <span class="pl-2">Clear</span>
            </button>
            <button type="submit"
              :disabled="form.vCenter.displayName.length == 0"
              class="disabled:cursor-not-allowed disabled:opacity-50 col-start-2 inline-flex shrink items-center py-2 border  text-sm font-medium rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <PlusIcon class="w-5 h-5 ml-2 shrink text-gray-700" />
              <span class="pl-2">{{ form.vCenter.idx != null && form.vCenter.idx != undefined && form.vCenter.idx >= 0 ? 'Save Changes' : 'Add vCenter'}}</span>
            </button>
          </form>
          <div class="p-2 mt-2 flex flex-wrap max-h-40 bg-gray-50 rounded-lg border overflow-y-scroll space-x-2">
            <div class="inline-flex items-center content-center rounded-full bg-white space-x-2 px-2" v-for="(vCenter, idx) in form.site.vCenterServers" :key="vCenter.hostnameOrIP"
                :class="{'border-2 border-gray-500': vCenter.default, 'border border-gray-300': !vCenter.default}"
              >
              <button @click.stop.prevent="editvCenter(vCenter, idx)" class="pb-1 hover:bg-blue-100" >
                <span class="text-gray-800 text-xs">{{ vCenter.displayName }}</span>
              </button>
              <button @click.stop.prevent="removevCenter(vCenter, idx)" class="hover:bg-red-100">
                <XMarkIcon outline class="text-red-500 flex-shrink-0 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <!-- VCSA Servers End-->
        <!-- SMTP Info Start -->
        <div class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium">
          <span class="block pt-2 pb-2 text-sm font-medium">SMTP Config</span>
          <form ref="vCenterForm" class="grid grid-flow-rows items-center gap-y-1 gap-x-1">
            <label for="smtpServerAddress" class="mr-2">Server Address:</label>
            <input
              type="text"
              id="smtpServerAddress"
              placeholder="SMTP Server Address"
              v-model="form.site.smtp.address"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label class="mr-2" v-tippy
              content="Configure the email address template that clusters (or PC) will use when sending email alerts. @your.domain will configure each cluster or PC with their respective unique names under your domain 'your.domain'"
            >From Address:
              <div class="flex flex-row justify-center content-center space-x-2">
                <Combobox class="w-full max-w-[50%]" v-model="form.smtp.templateString">
                  <Option value="<siteName>">&lt;SiteName&gt;</Option>
                  <Option value="<clusterName>">&lt;ClusterName&gt;</Option>
                </Combobox>
                <div class="flex items-center">@</div>
                <input
                  type="text"
                  id="smtpServerFromAddress"
                  placeholder="your.domain"
                  v-model="form.smtp.domain"
                  class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full max-w-[50%] rounded-md sm:text-sm border-gray-300"
                />
              </div>
              <div class="flex flex-row space-x-2">
                <span>Example:</span>
                <span class="text-gray-600">{{ form.site.smtp.fromAddress }}</span>
              </div>
            </label>
          </form>
        </div>
        <!-- SMTP Info End-->
        <!-- LDAP Info Start -->
        <div class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium">
          <span class="block pt-2 pb-2 text-sm font-medium">LDAP Config</span>
          <form ref="vCenterForm" class="grid grid-flow-rows items-center gap-y-1 gap-x-1">
            <label for="ldapDirectoryName" class="mr-2">Directory Name:</label>
            <input
              type="text"
              id="ldapDirectoryName"
              placeholder="LDAP Directory Name"
              v-model="form.site.ldap.directoryName"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="ldapDirectoryUrl" class="mr-2">Directory URL:</label>
            <input
              type="text"
              id="ldapDirectoryUrl"
              placeholder="ldaps://your.domain"
              v-model="form.site.ldap.directoryUrl"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="ldapUsername" class="mr-2">Username:</label>
            <input
              type="text"
              id="ldapUsername"
              placeholder="Username"
              v-model="form.site.ldap.credentials.username"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="ldapPassword" class="mr-2">Password:</label>
            <PasswordField
              type="text"
              id="ldapPassword"
              placeholder="Password"
              v-model="form.site.ldap.credentials.password"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <TextList label="Admin Groups" class="pt-2 pb-2 px-2 col-span-1" placeholder="Group Name" hint="Enter LDAP groups to map to the Admin Role" v-model="form.site.ldap.adminRoleGroupMapping" />
          </form>
        </div>
        <!-- LDAP Info End-->
        <!-- LCM Darksite Info Start -->
        <div v-if="false" class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium">
          <span class="block pt-2 pb-2 text-sm font-medium">LCM Darksite</span>
          <form ref="vCenterForm" class="grid grid-flow-rows items-center gap-y-1 gap-x-1">
            <label for="lcmDarksiteUrl" class="mr-2">Server Address:</label>
            <input
              type="text"
              id="lcmDarksiteUrl"
              placeholder="http(s)://IPorFQDN/release/"
              v-model="form.site.lcmDarksiteUrl"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
          </form>
        </div>
        <!-- LCM Darksite End-->
        <!-- Prism Certificate Info Start -->
        <div class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium">
          <div class="flex items-center">
            <span class="block pt-2 pb-2 text-sm font-medium">Prism Certificate</span>
            <div v-if="certsProvided" v-tippy content="Certificate information saved.">
              <CheckCircleIcon class="w-8 h-8 text-green-700"/>
            </div>
          </div>
          <form ref="vCenterForm" class="grid grid-flow-rows items-center gap-y-1 gap-x-1">
            <label for="prismCertificate" class="mr-2">Certificate:</label>
            <input
              type="file"
              id="prismCertificate"
              @change="certificateFileChanged"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="prismCAChain" class="mr-2">CA Chain:</label>
            <input
              type="file"
              id="prismCAChain"
              @change="caChainFileChanged"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
            <label for="prismKey" class="mr-2">Key:</label>
            <input
              type="file"
              id="vCenterDisplayName"
              @change="keyFileChanged"
              class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 block w-full rounded-md sm:text-sm border-gray-300"
            />
          </form>
        </div>
        <!-- Prism Certificate Info End-->
        <!-- AOS List Start -->
        <div class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium space-y-2">
          <div class="flex justify-between">
            <span class="block pt-2 pb-2 text-sm font-medium">AOS List</span>
            <AOSModal :site="site"/>
          </div>
          <AOSModal v-for="aos in site.aosList" :aos="aos" :site="site">
            <div class="flex p-1.5 border rounded-md bg-gray-50 space-x-1.5">
              <span>Name:</span>
              <span>{{ aos.name }}</span>
              <Badge :color="statusColor(aos.status)">{{ startCase(aos.status) }}</Badge>
              <Badge :color="transferStatusColor(aos.transferStatus)" label="Transfer Status">{{ startCase(aos.transferStatus) }}</Badge>
              <span>Version:</span>
              <span>{{ aos.version }}</span>
            </div>
          </AOSModal>
        </div>
        <!-- AOS List End -->
        <!-- Hypervisor List Start -->
        <div class="bg-gray-100 rounded-md py-2 px-2 text-sm font-medium space-y-2">
          <div class="flex justify-between">
            <span class="block pt-2 pb-2 text-sm font-medium">Hypervisor List</span>
            <HypervisorModal :site="site"/>
          </div>
          <HypervisorModal v-for="hypervisor in site.hypervisorList" :hypervisor="hypervisor" :site="site">
            <div class="flex p-1.5 border rounded-md bg-gray-50 space-x-1.5">
              <span>Name:</span>
              <span>{{ hypervisor.name }}</span>
              <Badge :color="statusColor(hypervisor.status)">{{ startCase(hypervisor.status) }}</Badge>
              <Badge :color="transferStatusColor(hypervisor.transferStatus)" label="Transfer Status">{{ startCase(hypervisor.transferStatus) }}</Badge>
              <span>Version:</span>
              <span>{{ hypervisor.version }}</span>
            </div>
          </HypervisorModal>
        </div>
        <!-- Hypervisor List End -->
      </div>
    </div>
    </form>
  </template>
</template>

