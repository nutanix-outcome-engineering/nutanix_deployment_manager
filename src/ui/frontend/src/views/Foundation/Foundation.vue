<script setup>
import { ref, computed, onMounted } from 'vue'
import { XCircleIcon, FingerPrintIcon, TagIcon, MapPinIcon, ChevronDownIcon, ServerIcon } from '@heroicons/vue/24/solid'

import PageHeading from '@/components/PageHeading.vue'
import FoundationModal from './FoundationModal.vue'
import Badge from '@/components/Core/Badge.vue'
import Paginate from '@/components/Core/Paginate.vue'
import AdvancedPagination from '@/components/Core/Pagination/AdvancedPagination.vue'
import AppLink from '@/components/Core/AppLink.vue'
import ExternalLink from '@/components/Core/ExternalLink.vue'
import { FilterBox, FilterQuery, FilterButton, ClearQueryButton, SuggestionList, Suggestion } from '@/components/Core/FilterBox.js'
import useFoundation from '../../composables/useFoundation'

const { getAllFVMs } = useFoundation()

const form = ref({
  search: '',
  filters: []
})
const fvms = ref([])

onMounted(async () => fvms.value = await getAllFVMs())

</script>

<template>
  <div class="space-y-6 p-2">
      <PageHeading title="Foundation Servers">
        <FoundationModal @newFVM="(newFVM) => fvms.push(newFVM)"/>
      </PageHeading>
      <div>
        <FilterBox
          v-model:filters="form.filters"
          :items="fvms"
          :filterable="[
            { label: 'Name', field: 'ip', op: ['~'], mode: 'simple'}
          ]"
          v-slot="{ results, filters, suggestions }"
        >
        <Paginate :items="results" :perPage="10">
          <template #default="{ items: fvms, page }">
            <div class="relative">
              <div class="mb-6 flex justify-end space-x-10">
                <div class="flex-1 px-3 py-1 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 border border-gray-300 rounded-md  hadow-sm overflow-hidden">
                  <label for="email" class="sr-only block text-sm font-medium text-gray-700">Filter</label>
                  <div class="flex items-center">
                    <ClearQueryButton class="-ml-1 mr-1">
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

            <!-- FVM List Section --><div class="bg-white shadow sm:rounded-md border border-gray-100" v-show="results.length > 0">
              <ul class="divide-y divide-gray-200">
                <li v-for="fvm in fvms" :key="fvm.uuid" class="px-6 py-4 hover:bg-gray-50">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-medium text-gray-800">
                        <ExternalLink :href="`http://${fvm.ip}`" class="truncate w-full font-medium">{{ fvm.ip }}</ExternalLink>
                      </h3>
                      <div class="flex space-x-2">
                        <Badge color="blue">
                          <div class="flex items-center space-x-1.5">
                            <!-- <Icon solid :name="status(server).icon" class="w-4 h-4" :class="{ 'animate-spin': status(server).animated }" /> -->
                            <span>{{ fvm.status }}</span>
                            <!-- <span v-if="server.imaging">({{ server.percentComplete || 0 }}%)</span> -->
                          </div>
                        </Badge>
                        <div class="flex items-center text-gray-500 text-sm space-x-1">
                          <TagIcon class="w-5 h-5"/>
                          <span class="truncate">{{ fvm.version }}</span>
                        </div>
                      </div>
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
