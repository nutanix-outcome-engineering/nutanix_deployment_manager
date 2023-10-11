
<script setup>
import { ref } from 'vue'
import useSites from '@/composables/useSites.js'


import SiteModal from './SiteModal.vue'

const { sites, setupPoll, addSite, editSite } = useSites()

setupPoll()

</script>
<template>
  <div class="flex flex-1 flex-row">
  <div class="flex flex-1 flex-col py-6 sm:px-6 lg:px-8 ">
    <div class="px-4 sm:px-6 lg:px-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">SITES</h1>
          <p class="mt-2 text-sm text-gray-700">List of sites</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
        <SiteModal @handleSubmit="addSite">
        </SiteModal>
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
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter sm:table-cell">Name</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter lg:table-cell">Infra Cluster</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">NTP Servers</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter">DNS Servers</th>
                    <th scope="col" class="sticky top-0 z-10 border-b border-gray-300 bg-gray-50 bg-opacity-75 py-3.5 pr-4 pl-3 backdrop-blur backdrop-filter sm:pr-6 lg:pr-8">
                      <span class="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white">
                  <tr v-for="(site, siteIdx) in sites" :key="site.id">
                    <td :class="[siteIdx !== sites.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 lg:pl-8']">{{ site.id }}</td>
                    <td :class="[siteIdx !== sites.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell']">{{ site.name }}</td>
                    <td :class="[siteIdx !== sites.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell']">{{ site.infraCluster }}</td>
                    <td :class="[siteIdx !== sites.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ site.ntpServers }}</td>
                    <td :class="[siteIdx !== sites.length - 1 ? 'border-b border-gray-200' : '', 'whitespace-nowrap px-3 py-4 text-sm text-gray-500']">{{ site.dnsServers }}</td>
                    <td :class="[siteIdx !== sites.length - 1 ? 'border-b border-gray-200' : '', 'relative whitespace-nowrap py-4 pr-4 pl-3 text-right text-sm font-medium sm:pr-6 lg:pr-8']">
                      <SiteModal @handleSubmit="editSite" :site="site">
                        <span class="text-indigo-600 hover:text-indigo-900 hover:underline cursor-pointer decoration-from-font">Edit</span>
                        <span class="sr-only">, {{ site.id }}</span>
                      </SiteModal>
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
