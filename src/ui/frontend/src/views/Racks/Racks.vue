
<script setup>
import { ref } from 'vue'
import useRacks from '@/composables/useRacks.js'

import AddRackModal from '../Racks/AddRackModal.vue';

const { racks, setupPoll, addRack, editRack } = useRacks()

setupPoll()

</script>
<template>
  <div class="flex flex-1 flex-row">
  <div class="flex flex-1 flex-col py-6 sm:px-6 lg:px-8 ">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">RACKS</h1>
          <p class="mt-2 text-sm text-gray-700">List of racks</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <AddRackModal @handleSubmit="addRack">
        </AddRackModal>
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
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell">SiteID</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell">Name</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">Row</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">Column</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">Data Hall</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pr-4 pl-3 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8">
                      <span class="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white">
                  <tr v-for="(rack, rackIdx) in racks" :key="rack.id">
                    <td :class="[rackIdx !== racks.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8']">{{ rack.id }}</td>
                    <td :class="[rackIdx !== racks.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell']">{{ rack.siteID }}</td>
                    <td :class="[rackIdx !== racks.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell']">{{ rack.name }}</td>
                    <td :class="[rackIdx !== racks.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ rack.row }}</td>
                    <td :class="[rackIdx !== racks.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ rack.column }}</td>
                    <td :class="[rackIdx !== racks.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ rack.datahall }}</td>
                    <td :class="[rackIdx !== racks.length - 1 ? 'border-b border-gray-200' : '', 'relative whitespace-nowrap py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6 lg:pr-8']">
                      <AddRackModal @handleSubmit="editRack" :rack="rack">
                        <span class="text-indigo-600 hover:text-indigo-900 hover:underline cursor-pointer decoration-from-font">Edit</span>
                        <span class="sr-only">, {{ rack.id }}</span>
                      </AddRackModal>
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
