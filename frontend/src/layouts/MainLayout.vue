<template>
  <div class="relative min-h-screen md:flex bg-gray-50">
    <!-- Overlay for mobile -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black opacity-30 z-20 md:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'bg-white shadow-xl w-64 fixed inset-y-0 left-0 transform transition-transform duration-200 ease-in-out z-30 flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'md:relative md:transform-none',
        !sidebarOpen ? 'md:hidden' : '',
      ]"
    >
      <!-- Sidebar Header -->
      <div
        class="flex h-16 items-center justify-between px-4 border-b border-gray-200"
      >
        <h1 class="text-xl font-bold text-gray-900">Kafka Manager</h1>
        <button
          type="button"
          class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          @click="sidebarOpen = false"
          title="Đóng Sidebar"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- Navigation Menu -->
      <nav class="mt-5 px-2 flex-1">
        <div class="space-y-1">
          <!-- Dashboard Link -->
          <router-link
            to="/dashboard"
            :class="[
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
              $route.path === '/dashboard'
                ? 'bg-indigo-100 text-indigo-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
            ]"
            @click="handleNavClick"
          >
            <HomeIcon
              :class="[
                'mr-3 h-5 w-5',
                $route.path === '/dashboard'
                  ? 'text-indigo-500'
                  : 'text-gray-400',
              ]"
            />
            Dashboard
          </router-link>

          <!-- Cấu hình Dropdown -->
          <div>
            <button
              @click="toggleConfigMenu"
              :class="[
                'group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md',
                isConfigOpen || $route.path.startsWith('/configuration') // *** FIX: Watch 'configuration' path ***
                  ? 'bg-indigo-100 text-indigo-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              ]"
            >
              <span class="flex items-center">
                <Cog8ToothIcon
                  :class="[
                    'mr-3 h-5 w-5',
                    isConfigOpen || $route.path.startsWith('/configuration')
                      ? 'text-indigo-500'
                      : 'text-gray-400', // *** FIX: Watch 'configuration' path ***
                  ]"
                />
                Cấu hình
              </span>
              <ChevronDownIcon
                :class="[
                  'h-5 w-5 transition-transform',
                  isConfigOpen ? 'rotate-180' : '',
                ]"
              />
            </button>

            <!-- Submenu Cấu hình -->
            <div v-if="isConfigOpen" class="mt-2 space-y-1 pl-9">
              <router-link
                to="/configuration/topics"
                :class="[
                  'block px-2 py-2 text-sm rounded-md',
                  $route.path.startsWith('/configuration/topics') // *** FIX: Watch 'configuration/topics' path ***
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ]"
                @click="handleNavClick"
              >
                Quản lý Topic
              </router-link>
              <router-link
                to="/consumer-dashboard"
                :class="[
                  'block px-2 py-2 text-sm rounded-md',
                  $route.path === '/consumer-dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ]"
                @click="handleNavClick"
              >
                Quản lý Consumer
              </router-link>
              <router-link
                to="/configuration/auto-send"
                :class="[
                  'block px-2 py-2 text-sm rounded-md',
                  $route.path === '/configuration/auto-send'
                    ? 'bg-indigo-50 text-indigo-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ]"
                @click="handleNavClick"
              >
                Gửi tự động
              </router-link>
            </div>
          </div>

        
        </div>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-200">
      <!-- Header -->
      <header
        class="flex h-16 items-center justify-between bg-white px-4 shadow-sm border-b border-200"
      >
        <div class="flex items-center">
          <button
            type="button"
            class="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 mr-4"
            @click="sidebarOpen = !sidebarOpen"
            :title="sidebarOpen ? 'Đóng Sidebar' : 'Mở Sidebar'"
          >
            <Bars3Icon class="h-6 w-6" />
          </button>
          <!-- SỬA: Cập nhật tiêu đề trang động -->
          <h2 class="text-2xl font-bold text-gray-900">
            {{ $route.meta.title || "Dashboard" }}
          </h2>
        </div>

        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-4">
            <div class="text-right hidden md:block">
              <p class="text-sm font-medium text-gray-900">
                {{ user.fullName }}
              </p>
              <p class="text-xs text-gray-500">{{ user.email }}</p>
            </div>
            <img
              class="h-8 w-8 rounded-full"
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Admin"
            />
            <button
              @click="handleLogout"
              class="rounded-full p-2 text-gray-400 hover:bg-red-100 hover:text-red-500"
              title="Đăng xuất"
            >
              <ArrowRightOnRectangleIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <!-- <main class="flex-1 overflow-y-auto p-6"> -->
      <router-view />
      <!-- </main> -->

      <!-- Footer -->
      <footer class="bg-[#E7D2F9] py-3 sm:py-4">
        <div
          class="container mx-auto px-4 text-center text-gray-600 text-xs sm:text-sm"
        >
          © 2025 Kafka Manager. All rights reserved.
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  HomeIcon,
  Cog8ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const route = useRoute();

// State
const sidebarOpen = ref(true);
// *** FIX: Watch 'configuration' path ***
const isConfigOpen = ref(route.path.startsWith("/configuration"));

const user = ref({
  fullName: "Admin User",
  email: "admin@kafka-manager.com",
});

// Watch route changes để tự động mở menu Cấu hình
watch(
  route,
  (newRoute) => {
    // *** FIX: Watch 'configuration' path ***
    if (newRoute.path.startsWith("/configuration")) {
      isConfigOpen.value = true;
    }
  },
  { immediate: true }
);

// Methods
const toggleConfigMenu = () => {
  isConfigOpen.value = !isConfigOpen.value;
};

const handleNavClick = () => {
  // Đóng sidebar trên mobile khi click vào nav item
  if (window.innerWidth < 768) {
    sidebarOpen.value = false;
  }
};

const handleLogout = () => {
  console.log("Logging out...");
};
</script>
