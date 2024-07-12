<script setup>
import { ref, unref, watch, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/Core/Button.vue'
import useAPI from '@/composables/useAPI.js'


const { axios } = useAPI()
const router = useRouter()

const validationErrors = ref({
  oldIsSame: false,
  newPassMismatch: false
})

const form = ref({
  oldPass: '',
  newPass: '',
  newPassVerify: ''
})

const valid = computed(() => {
  return !validationErrors.value.newPassMismatch && !validationErrors.value.oldIsSame && form.value.newPass.length > 0
})

watch(form, () => {
  if (form.value.oldPass == form.value.newPass) {
    validationErrors.value.oldIsSame = true
  } else {
    validationErrors.value.oldIsSame = false
  }
  if (form.value.newPass != form.value.newPassVerify) {
    validationErrors.value.newPassMismatch = true
  } else {
    validationErrors.value.newPassMismatch = false
  }
}, { deep: true })



async function submit() {
  await axios.post('/me/resetpassword', unref(form.value))
  router.push({name: 'login'})
}

</script>
<template>

<div class="flex min-h-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
<div class="w-full max-w-md space-y-8">
  <div>
    <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">Change User Password</h2>
  </div>
  <div v-if="!valid" class="text-red-400">
    <p v-if="validationErrors.oldIsSame">Old and New Passwords match.</p>
    <p v-if="validationErrors.newPassMismatch">New Passwords do not match.</p>
  </div>
  <div class="mt-8 space-y-2">
    <div>
      <label for="oldPass" class="mr-2">Old Password:</label>
      <input class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 w-full rounded-md sm:text-sm border-gray-300"
        v-model="form.oldPass" type="password" id="oldPass" placeholder="Password"/>
    </div>


    <div>
      <label for="newPass" class="mr-2">New Password:</label>
      <input class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 w-full rounded-md sm:text-sm border-gray-300"
        v-model="form.newPass" type="password" id="newPass" placeholder="New Password"/>
    </div>

    <div>
      <label for="newPassVerify" class="mr-2">Repeat New Password:</label>
      <input class="invalid:bg-red-100 focus:ring-blue-500 focus:border-blue-500 w-full rounded-md sm:text-sm border-gray-300"
        v-model="form.newPassVerify" type="password" id="newPassVerify" placeholder="Repeat New Password"/>
    </div>
    <div>
      <Button kind="primary" @click="submit()" :disabled="!valid">Change Password</Button>
    </div>
  </div>
    </div>
  </div>
</template>
