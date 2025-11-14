<template>
  <div>
    <!-- Tabs điều hướng con -->
    <div class="border-b border-gray-200">
      <nav class="-mb-px flex space-x-8 px-8" aria-label="Tabs">
        <router-link
          v-for="tab in tabs"
          :key="tab.name"
          :to="tab.to"
          :class="[
            $route.path === tab.to || ($route.path.startsWith('/configuration/topics') && tab.to === '/configuration/topics')
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
          ]"
        >
          {{ tab.name }}
        </router-link>
      </nav>
    </div>

    <!-- 
      SỬA LỖI Ở ĐÂY:
      Thêm thẻ <router-view /> bên dưới. 
      Đây là nơi Vue Router sẽ render các component con (như TopicListView và TopicDetailView)
    -->
    <div class="p-8">
      <router-view />
    </div>

  </div>
</template>

<script setup>
// const tabs = [
//   { name: 'Quản lý Topic', to: '/configuration/topics' },
//   { name: 'Quản lý Consumer', to: '/configuration/consumers' },
//   { name: 'Gửi tự động', to: '/configuration/auto-send' },
// ]
</script>