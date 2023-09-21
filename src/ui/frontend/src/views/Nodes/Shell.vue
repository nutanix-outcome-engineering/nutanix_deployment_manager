<script setup>
import AppLink from '@/components/Core/AppLink.vue'
import useNodes from '@/composables/useNodes.js'
import { computed } from 'vue';

const { ingestingNodes, nodes, allNodes, fetchAll, setupPoll, foundationDiscoverNodes, discoveredNodes } = useNodes()
const discoveredNodeCount = computed(() => discoveredNodes.value.filter(dNode => !allNodes.value.find(node => node.serial === dNode.serial)).length)
const ingestingNodeCount = computed(() => ingestingNodes.value.filter(node => node.ingestState != 'pendingReview').length)
const pendingReviewNodeCount = computed(() => ingestingNodes.value.filter(node => node.ingestState == 'pendingReview').length)

setupPoll('30s')
fetchAll()
foundationDiscoverNodes()
</script>

<template>
  <div class="">
    <div class="hidden sm:block">
      <div class="border-b border-gray-200 -mb-px mt-8 flex items-center justify-center gap-4">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <AppLink :to="{name: 'nodes.nodes'}"
            class="whitespace-nowrap inline-flex py-4 px-1 font-medium text-sm gap-2"
            exact-active-class="border-indigo-500 text-indigo-600"
            active-class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
            inactive-class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
          >
            <span>Nodes</span>
            <span class="hidden bg-gray-100 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">{{ nodes.length }}</span>
          </AppLink>
          <tippy allowHTML :content="`Discovered Nodes: ${discoveredNodeCount}<br>Ingesting Nodes: ${ingestingNodeCount}<br>Nodes Pending Review: ${pendingReviewNodeCount}`">
            <AppLink :to="{name: 'nodes.discovery'}"
              class="whitespace-nowrap inline-flex py-4 px-1 font-medium text-sm gap-2"
              exact-active-class="border-indigo-500 text-indigo-600"
              active-class="border-indigo-500 text-indigo-600"
              inactive-class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
            >
              <span>Discovery</span>
              <span class="hidden bg-gray-100 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">{{ discoveredNodeCount + ingestingNodeCount + pendingReviewNodeCount }}</span>
            </AppLink>
          </tippy>
        </nav>
      </div>
    </div>
  </div>
  <div class="flex flex-1 flex-col">
    <div v-if="$route.matched.some(({name}) => name == 'nodes.discoveryShell')" class="flex flex-col">
      <ol role="list" class="flex items-center rounded-md border border-gray-300">
        <li class="relative flex flex-1">
          <AppLink :to="{name: 'nodes.discovery'}"
            exact-active-class="border-indigo-600 text-indigo-600"
            active-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
            inactive-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
          >
            <span class="flex items-center px-6 py-4 text-sm font-medium border-inherit">
              <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-inherit">1</span>
              <span class="ml-4 text-sm font-medium">Discovery</span>
              <span class="hidden bg-gray-100 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">{{ discoveredNodeCount }}</span>
            </span>
          </AppLink>

          <div class="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
            <svg class="h-full w-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
              <path d="M0 -2L20 40L0 82" vector-effect="non-scaling-stroke" stroke="currentcolor" stroke-linejoin="round" />
            </svg>
          </div>
        </li>
        <li class="relative flex flex-1">
          <AppLink :to="{name: 'nodes.ingesting'}"
            exact-active-class="border-indigo-600 text-indigo-600"
            active-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
            inactive-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
          >
            <span class="flex items-center px-6 py-4 text-sm font-medium border-inherit">
              <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-inherit">2</span>
              <span class="ml-4 text-sm font-medium">Ingesting</span>
              <span class="hidden bg-gray-100 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">{{ ingestingNodeCount }}</span>

            </span>
          </AppLink>

          <div class="absolute right-0 top-0 hidden h-full w-5 md:block" aria-hidden="true">
            <svg class="h-full w-full text-gray-300" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none">
              <path d="M0 -2L20 40L0 82" vector-effect="non-scaling-stroke" stroke="currentcolor" stroke-linejoin="round" />
            </svg>
          </div>
        </li>
        <li class="relative flex flex-1">
          <AppLink :to="{name: 'nodes.pendingReview'}"
            exact-active-class="border-indigo-600 text-indigo-600"
            active-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
            inactive-class="border-transparent text-gray-500 hover:text-gray-700 border-gray-300 hover:border-gray-700"
          >
            <span class="flex items-center px-6 py-4 text-sm font-medium border-inherit">
              <span class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-inherit">3</span>
              <span class="ml-4 text-sm font-medium">Pending Review</span>
              <span class="hidden bg-gray-100 ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">{{ pendingReviewNodeCount }}</span>
            </span>
          </AppLink>
        </li>
      </ol>
    </div>
    <router-view></router-view>
  </div>

</template>
