<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import Dashboard from '../views/Dashboard.vue'
import AppLink from '../components/Core/AppLink.vue'
import imgUrl from '/src/assets/Will-Whitt_01_web.jpg'
import RecentTasks from '../views/Tasks/RecentTasks.vue'
import useTus from '@/composables/useTus.js'

const { uploads } = useTus()

const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
  imgUrl,
}
const navigation = [
  { name: 'sites', displayName: "Sites", href: '/sites', current: true },
  { name: 'racks', displayName: "Racks",href: '/racks', current: false },
  { name: 'switches', displayName: "Switches",href: '/switches', current: false },
  { name: 'nodes.nodes', displayName: "Nodes", href: '/nodes', current: false },
  { name: 'clusters', displayName: "Clusters", href: '/clusters', current: false },
  // { name: 'Clusters', href: '#', current: false },
  { name: 'foundation', displayName: "Foundation", href: '/foundation', current: false },
  // { name: 'Reports', href: '#', current: false },
]
const userNavigation = [
  { name: 'Your Profile', href: '#' },
  { name: 'Settings', href: '#' },
  { name: 'Sign out', href: '#' },
]
</script>

<template>
  <div class="flex flex-1 flex-col min-h-full overscroll-none">
    <Disclosure as="nav" class="bg-gray-800 sticky top-0 z-50" v-slot="{ open }">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex h-16 items-center justify-between">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <img class="h-8 w-8" src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
            </div>
            <div class="hidden md:block">
              <div class="ml-10 flex items-baseline space-x-4">
                <AppLink v-for="item in navigation" :key="item.name" :to="item" class="px-3 py-2 rounded-md text-sm font-medium" active-class="bg-gray-900 text-white" exact-active-class="bg-gray-900 text-white" inactive-class="text-gray-300 hover:bg-gray-700 hover:text-white">{{ item.displayName }}</AppLink>
                <!-- <a v-for="item in navigation" :key="item.name"  :href="item.href" :class="[current == item.name ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white', 'px-3 py-2 rounded-md text-sm font-medium']" :aria-current="item.current ? 'page' : undefined">{{ item.name }}</a> -->
              </div>
            </div>
          </div>
          <div class="hidden md:block">
            <div class="ml-4 flex items-center md:ml-6">
              <RecentTasks/>

              <!-- Profile dropdown -->
              <Menu as="div" class="relative ml-3">
                <div>
                  <MenuButton class="flex max-w-xs items-center rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                    <span class="sr-only">Open user menu</span>
                    <!-- <img class="h-8 w-8 rounded-full" :src="user.imageUrl" alt="" /> -->
                    <img class="h-8 w-8 rounded-full" src="@/assets/Will-Whitt_01_web.jpg" alt="" />
                  </MenuButton>
                </div>
                <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
                  <MenuItems class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <MenuItem v-for="item in userNavigation" :key="item.name" v-slot="{ active }">
                      <a :href="item.href" :class="[active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700']">{{ item.name }}</a>
                    </MenuItem>
                  </MenuItems>
                </transition>
              </Menu>
            </div>
          </div>
          <div class="-mr-2 flex md:hidden">
            <!-- Mobile menu button -->
            <DisclosureButton class="inline-flex items-center justify-center rounded-md bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
              <span class="sr-only">Open main menu</span>
              <Bars3Icon v-if="!open" class="block h-6 w-6" aria-hidden="true" />
              <XMarkIcon v-else class="block h-6 w-6" aria-hidden="true" />
            </DisclosureButton>
          </div>
        </div>
      </div>

      <DisclosurePanel class="md:hidden">
        <div class="space-y-1 px-2 pt-2 pb-3 sm:px-3">
          <DisclosureButton v-for="item in navigation" :key="item.name" as="a" :href="item.href" :class="[item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white', 'block px-3 py-2 rounded-md text-base font-medium']" :aria-current="item.current ? 'page' : undefined">{{ item.name }}</DisclosureButton>
        </div>
        <div class="border-t border-gray-700 pt-4 pb-3">
          <div class="flex items-center px-5">
            <div class="flex-shrink-0">
              <!-- <img class="h-10 w-10 rounded-full" :src="user.imageUrl" alt="" /> -->
              <img class="h-10 w-10 rounded-full" src="@/assets/Will-Whitt_01_web.jpg" alt="" />
            </div>
            <div class="ml-3">
              <div class="text-base font-medium leading-none text-white">{{ user.name }}</div>
              <div class="text-sm font-medium leading-none text-gray-400">{{ user.email }}</div>
            </div>
            <button type="button" class="ml-auto flex-shrink-0 rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
              <span class="sr-only">View notifications</span>
              <BellIcon class="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div class="mt-3 space-y-1 px-2">
            <DisclosureButton v-for="item in userNavigation" :key="item.name" as="a" :href="item.href" class="block rounded-md px-3 py-2 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white">{{ item.name }}</DisclosureButton>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>

    <main class="flex flex-1 flex-col overscroll-none">
      <!-- <slot/> -->
      <router-view/>
    </main>
  </div>
</template>
