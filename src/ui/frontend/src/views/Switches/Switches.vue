
<script setup>
import { ref, onBeforeMount } from 'vue'
import useSwitches from '@/composables/useSwitches.js'
import useRacks from '@/composables/useRacks.js'

import AddSwitchModal from '../Switches/AddSwitchModal.vue';

const { switches, setupPoll, addSwitch, editSwitch } = useSwitches()
const { racks, getRacks } = useRacks()

setupPoll()

onBeforeMount(() => {getRacks()})

</script>
<template>
  <div class="flex flex-1 flex-row">
  <div class="flex flex-1 flex-col py-6 sm:px-6 lg:px-8 ">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">Switches</h1>
          <p class="mt-2 text-sm text-gray-700">List of switches</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <AddSwitchModal @handleSubmit="addSwitch">
        </AddSwitchModal>
        </div>
      </div>
      <div class="mt-8 flex flex-col max-h-[600px] overflow-y-auto">
        <div class="-my-2 -mx-4 sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle">
            <div class="shadow-sm ring-1 ring-black ring-opacity-5">
              <table class="min-w-full border-separate" style="border-spacing: 0">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:pl-6 lg:pl-8">Id</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell">Type</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell">Name</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">IP</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">RackID</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">Rack Unit</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pr-4 pl-3 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8">
                      <span class="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white">
                  <tr v-for="(sw, swIdx) in switches" :key="sw.id">
                    <td :class="[swIdx !== switches.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8']">{{ sw.id }}</td>
                    <td :class="[swIdx !== switches.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500  sm:table-cell']">{{ sw.type }}</td>
                    <td :class="[swIdx !== switches.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500  lg:table-cell']">{{ sw.name }}</td>
                    <td :class="[swIdx !== switches.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ sw.ip }}</td>
                    <td :class="[swIdx !== switches.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ sw.rackID }}</td>
                    <td :class="[swIdx !== switches.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ sw.rackUnit }}</td>
                    <td :class="[swIdx !== switches.length - 1 ? 'border-b border-gray-200' : '', 'relative whitespace-nowrap py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6 lg:pr-8']">
                      <AddSwitchModal @handleSubmit="editSwitch" :sw="sw">
                        <span class="text-indigo-600 hover:text-indigo-900 hover:underline cursor-pointer decoration-from-font">Edit</span>
                        <span class="sr-only">, {{ sw.id }}</span>
                      </AddSwitchModal>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>
