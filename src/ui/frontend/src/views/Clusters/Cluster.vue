<script setup>
import useClusters from '@/composables/useClusters.js'
import AppLink from '@/components/Core/AppLink.vue'
import Button from '@/components/Core/Button.vue'
import Badge from '@/components/Core/Badge.vue'
import { FilterBox, FilterQuery, FilterButton, ClearQueryButton, SuggestionList, Suggestion } from '@/components/Core/FilterBox.js'
import { XCircleIcon, FingerPrintIcon, TagIcon, MapPinIcon, ChevronDownIcon, ServerIcon } from '@heroicons/vue/24/solid'
import Paginate from '@/components/Core/Paginate.vue'
import AdvancedPagination from '@/components/Core/Pagination/AdvancedPagination.vue'
import PageHeading from '@/components/PageHeading.vue'
import ExternalLink from '@/components/Core/ExternalLink.vue'

import { orderBy } from 'lodash'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue'
import { ref, computed } from 'vue'

const SUGGESTION_MAX = 21

const { clusters, getClusters } = useClusters()
const form = ref({
  search: '',
  filters: []
})
const nodeSerialFilters = computed(() => {
      let sug = []
      sug.push( {
        suggestionLabel: `Contains "${form.value.search}"`,
        label: `contains "${form.value.search}"`,
        field: `nodes`,
        function: (item, value) => {
          let isFound = item.nodes.filter(node => node.serial.toLowerCase().includes(value.toLowerCase()))
          return isFound.length > 0
        }
      })
      //Exact serial number match
      clusters.value.some(cluster => {
        if (sug.length >= SUGGESTION_MAX) {
          return true
        }
        cluster.nodes.forEach((node, idx) => {
          if (node.serial.toLowerCase().includes(form.value.search.toLowerCase()) && sug.length < SUGGESTION_MAX) {
            const serial = `${node.serial}`
            sug.push( {
              suggestionLabel: node.serial,
              label: `${node.serial}`,
              field: `nodes[${idx}].serial`,
              function: (item, value) => {
                return item.nodes.filter(n => n.serial === serial).length > 0
              }
            })
          }
        })
      })
      return sug
    })

const chassisSerialFilters = computed(() => {
      let sug = []
      sug.push( {
        suggestionLabel: `Contains "${form.value.search}"`,
        label: `contains "${form.value.search}"`,
        field: `nodes`,
        function: (item, value) => {
          let isFound = item.nodes.filter(node => node.chassisSerial.toLowerCase().includes(value.toLowerCase()))
          return isFound.length > 0
        }
      })
      //Exact serial number match
      clusters.value.some(cluster => {
        if (sug.length >= SUGGESTION_MAX) {
          return true
        }

        cluster.nodes.some((node, idx) => {
          if (node.chassisSerial.toLowerCase().includes(form.value.search.toLowerCase()) && sug.length < SUGGESTION_MAX) {
            const serial = `${node.chassisSerial}`

            // Don't need to add another suggestion if it already exists.
            if (!sug.find(s => s.label === serial)) {
              sug.push({
                suggestionLabel: node.chassisSerial,
                label: `${node.chassisSerial}`,
                field: `nodes[${idx}].chassisSerial`,
                function: (item, value) => {
                  return item.nodes.filter(n => n.chassisSerial === serial).length > 0
                }
              })
            }
            return true
          } else { return false }
        })
      })
      return sug
    })



getClusters()
</script>

<template>
  <div class="space-y-6 pb-2 pt-2 pl-2 pr-2">
    <PageHeading title="Clusters">
      <!-- <router-link :to="{ name: 'admin.clusters.create' }">
        <Button kind="primary">New Cluster</Button>
      </router-link> -->
    </PageHeading>

    <div>
      <FilterBox
        v-model:filters="form.filters"
        :filterable="[
          { label: 'Cluster ID', field: 'id', op: ['~'], mode: 'simple' },
          { label: 'Name', field: 'name', op: ['~'], mode: 'simple' },
          { label: 'Cluster VIP', field: 'cluster.ip', mode: 'simple', op: ['='] },
          // { label: 'Model', field: 'model', mode: 'enum' },
          { label: 'Site', field: 'site.name', mode: 'enum' },
          { label: 'Node Serial', mode: 'custom',
            filters: nodeSerialFilters
          },
          { label: 'Chassis Serial', mode: 'custom',
            filters: chassisSerialFilters
          },
        ]"
        :items="clusters"
        v-slot="{ results, filters, suggestions }"
      >
        <Paginate :items="results" :perPage="10">
          <template #default="{ items: clusters, page }">
            <div class="relative">
              <div class="mb-6 flex justify-end space-x-10">
                <div class="flex-1 px-3 py-1 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 border border-gray-300 rounded-md  hadow-sm overflow-hidden">
                  <label for="email" class="sr-only block text-sm font-medium text-gray-700">Filter</label>
                  <div class="flex items-center">
                    <ClearQueryButton>
                      <XCircleIcon class="w-5 h-5 text-red-400" v-tippy content="Reset Filter"/>
                    </ClearQueryButton>
                    <div class="space-x-2 flex items-center">
                      <FilterButton v-for="(filter, index) in filters" :key="index">
                        <Badge v-if="filter.mode == 'custom'" :label="filter.label.field" :color="filter.label.color">
                          <div class="flex items-center">
                            {{ filter.label.value }}
                            <XCircleIcon class="ml-2 -mr-1 w-4 h-4 text-gray-400" />
                          </div>
                        </Badge>
                        <Badge v-else :label="filter.label.field" :color="filter.label.color">
                          <div class="flex items-center">
                            {{ filter.value }}
                            <XCircleIcon class="ml-2 -mr-1 w-4 h-4 text-gray-400" />
                          </div>
                        </Badge>

                      </FilterButton>
                    </div>
                    <FilterQuery as="input" type="text" v-model="form.search" autocomplete="off" class="focus:ring-0 focus:outline-none border-none block w-full text-sm" placeholder="Filter" />
                  </div>
                </div>
                <AdvancedPagination :page="page" />
              </div>

              <!-- Suggestions -->
              <div class="absolute top-0 mt-12 rounded-md shadow-lg border w-full" v-if="suggestions.length">
                <div class="rounded-md shadow-xs overflow-hidden">
                  <div class="z-20 relative grid gap-4 bg-white px-5 py-6">
                    <SuggestionList as="div" v-for="(suggestionList, listIndex) in suggestions" :key="listIndex">
                      <h3 class="mb-1 font-medium text-sm text-gray-600">{{ suggestionList.label }}</h3>
                      <div class="-mx-2 px-2">
                        <!-- Suggestion -->
                        <Suggestion as="button" v-for="(suggestion, index) in suggestionList.suggestions" :key="index" v-slot="{ isActive }" class="mb-2 mr-2 rounded-full focus:ring-2 focus:ring-blue-500">
                          <Badge :color="suggestion.filter.label.color">{{ suggestion.label }}</Badge>
                        </Suggestion>
                      </div>
                    </SuggestionList>
                  </div>
                </div>
              </div>
            </div>

            <!-- Clusters Summary Section -->
            <div class="bg-white shadow sm:rounded-md border border-gray-100" v-show="results.length > 0">
              <ul class="divide-y divide-gray-200">
                <li v-for="cluster in clusters" :key="cluster.id" class="px-6 py-4 hover:bg-gray-50">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-medium text-gray-800">
                        {{ cluster.name }}
                        <!-- <AppLink :href="`/clusters/${cluster.id}`" class="truncate w-full font-medium">{{ cluster.name }}</AppLink> -->
                      </h3>
                      <div class="text-gray-500 text-sm">{{ cluster.model }}</div>
                      <div class="mt-2 flex space-x-3 text-sm overflow-hidden">
                        <div class="flex whitespace-no-wrap items-center space-x-1 text-gray-500" v-tippy content="Cluster ID">
                          <FingerPrintIcon class="w-4 h-4" />
                          <span class="truncate">{{ cluster.id }}</span>
                        </div>
                        <div class="flex whitespace-no-wrap items-center space-x-1 text-gray-500" v-tippy content="Site">
                          <MapPinIcon class="w-4 h-4" />
                          <span class="truncate">{{ cluster.site.name }}</span>
                        </div>
                        <div class="flex whitespace-no-wrap items-center space-x-1 text-gray-500" v-tippy content="Cluster Size">
                          <ServerIcon class="w-4 h-4" />
                          <span class="truncate">{{ cluster.nodes.length }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center text-sm leading-5 font-medium space-x-4">
                      <Menu as="div" class="relative inline-block">
                        <MenuButton>
                          <Button kind="secondary">Launch
                            <ChevronDownIcon
                              class="ml-2 -mr-1 h-5 w-5 text-violet-200 hover:text-violet-100"
                              aria-hidden="true"
                            />
                          </Button>
                        </MenuButton>
                        <MenuItems class="absolute right-0 origin-top-right  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none px-1">
                          <MenuItem as="div" v-slot="{ active }">
                            <ExternalLink :href="`https://${cluster.cluster.hostname || cluster.cluster.ip}:9440`" class="truncate w-full font-medium" :class='{ "bg-blue-500": active }'>Prism Element</ExternalLink>
                          </MenuItem>
                          <MenuItem as="div" v-slot="{ active }">
                            <ExternalLink :href="`https://${cluster.prismCentral.hostname || cluster.prismCentral.ip}:9440`" class="truncate w-full font-medium" :class='{ "bg-blue-500": active }'>Prism Central</ExternalLink>
                          </MenuItem>
                          <MenuItem as="div" v-slot="{ active }">
                            <ExternalLink :href="`https://${cluster.vcenter.hostname || cluster.vcenter.ip}`" class="truncate w-full font-medium" :class='{ "bg-blue-500": active }'>vCenter</ExternalLink>
                          </MenuItem>
                        </MenuItems>
                      </Menu>
                      <Button kind="destructive" @dblclick.stop="remove(cluster)" content="Double-click to delete" v-tippy>Delete</Button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </template>
        </Paginate>
      </FilterBox>
    </div>
  </div>
</template>
