<template>
  <!-- Modal Tạo Topic -->
  <CreateTopicModal
    v-if="showCreateTopicModal"
    @close="showCreateTopicModal = false"
    @save="handleCreateTopic"
  />

  <!-- Modal Sửa Topic -->
  <UpdateTopicModal
    v-if="showUpdateTopicModal"
    :topicName="selectedTopic?.name"
    :currentPartitions="selectedTopic?.partitions"
    :loading="kafkaStore.loading"
    @close="showUpdateTopicModal = false"
    @save="handleUpdateTopic"
  />

  <!-- Modal Xóa Topic -->
  <DeleteTopicModal
    v-if="showDeleteTopicModal"
    :topicName="selectedTopic?.name"
    :loading="kafkaStore.loading"
    @close="showDeleteTopicModal = false"
    @confirm="handleDeleteTopic"
  />

  <!-- Container chính của trang -->
  <!-- *** FIX: Remove redundant padding/shadow, MainLayout handles this *** -->
  <div>
    <!-- Header của bảng -->
    <div class="flex items-center justify-between">
      <h2 class="text-xl font-semibold text-gray-900">
        Danh sách Topic hiện có
      </h2>
      <div class="flex items-center space-x-4">
        <span class="text-sm text-gray-500">
          Hiển thị: {{ topicsFromStore.length }} /
          {{ filteredTopics.length }} topics
          <span v-if="searchQuery">(đã lọc từ {{ topics.length }} topics)</span>
        </span>
        <button
          @click="showCreateTopicModal = true"
          class="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <PlusIcon class="w-5 h-5 mr-2" />
          Thêm Topic mới
        </button>
      </div>
    </div>

    <!-- Tìm kiếm -->
    <div class="relative mt-6">
      <label for="search" class="text-sm font-medium text-gray-700 sr-only"
        >Tìm kiếm</label
      >
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
        >
          <MagnifyingGlassIcon class="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          id="search"
          v-model="searchQuery"
          class="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Tìm theo tên topic..."
        />
      </div>
    </div>

    <!-- Bảng dữ liệu Topic -->
    <div class="mt-6 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Topic
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Total Records
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Batches
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Partitions
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
            >
              Số lượng Consumer đăng ký
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr
            v-for="topic in topicsFromStore"
            :key="topic.name"
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <!-- Button đến trang chi tiết topic với style border-reveal -->
              <router-link :to="'/configuration/topics/' + topic.name">
                <button
                  class="btn-border-reveal px-4 py-2 bg-transparent text-blue-600 border-2 border-blue-600 hover:text-white hover:bg-blue-600 rounded-lg font-medium transition-all duration-300 ease-in-out cursor-pointer"
                >
                  {{ topic.name }}
                </button>
              </router-link>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap font-semibold">
              {{ formatNumber(topic.totalRecords || 0) }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap font-semibold">
              {{ formatNumber(topic.batches || 0) }}
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
              <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                {{ topic.partitions || 0 }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ topic.consumerCount || 0 }} consumers
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <div class="flex items-center justify-center space-x-2">
                <!-- Nút Sửa -->
                <button
                  @click="openUpdateModal(topic)"
                  class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Cập nhật cấu hình"
                >
                  <PencilSquareIcon class="w-5 h-5" />
                </button>
                <!-- Nút Xóa -->
                <button
                  @click="openDeleteModal(topic)"
                  class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa topic"
                >
                  <TrashIcon class="w-5 h-5" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex items-center justify-center">
      <nav class="flex items-center space-x-2">
        <!-- Previous Button -->
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          :class="[
            'flex items-center justify-center w-10 h-10 rounded-lg border transition-colors',
            currentPage === 1
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <!-- Page Numbers -->
        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'flex items-center justify-center w-10 h-10 rounded-lg text-sm font-medium transition-colors',
            page === currentPage
              ? 'bg-blue-600 text-white'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
        >
          {{ page }}
        </button>

        <!-- Next Button -->
        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          :class="[
            'flex items-center justify-center w-10 h-10 rounded-lg border transition-colors',
            currentPage === totalPages
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50',
          ]"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
// *** FIX: Import Pinia and onMounted ***
import { ref, computed, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useKafkaStore } from "@/stores/kafkaStore";

import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/vue/24/outline";
import CreateTopicModal from "@/components/common/CreateTopicModal.vue";
import UpdateTopicModal from "@/components/common/UpdateTopicModal.vue";
import DeleteTopicModal from "@/components/common/DeleteTopicModal.vue";
import { useToast } from "@/composables/useToast";

const { success, error } = useToast();
const showCreateTopicModal = ref(false);
const showUpdateTopicModal = ref(false);
const showDeleteTopicModal = ref(false);
const selectedTopic = ref(null);
const searchQuery = ref("");
const currentPage = ref(1);
const itemsPerPage = 10;

// *** FIX: Setup Pinia Store ***
const kafkaStore = useKafkaStore();
const { topics } = storeToRefs(kafkaStore);

// Filtered and sorted topics
const filteredTopics = computed(() => {
  let filtered = [...topics.value];

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter((topic) =>
      topic.name.toLowerCase().includes(query)
    );
  }

  // Sắp xếp: Topic mới nhất lên đầu (theo tên - giả sử tên mới được tạo sau)
  // Nếu backend có timestamp, dùng timestamp thay vì name
  filtered.sort((a, b) => {
    // Sắp xếp theo tên giảm dần (topic mới tạo thường có tên sau)
    return b.name.localeCompare(a.name);
  });

  return filtered;
});

// Paginated topics
const topicsFromStore = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredTopics.value.slice(start, end);
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil(filteredTopics.value.length / itemsPerPage) || 1;
});

// Pagination methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// Visible page numbers (show max 5 pages)
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 5) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);

    if (current <= 3) {
      end = 5;
    } else if (current >= total - 2) {
      start = total - 4;
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }

  return pages;
});

onMounted(() => {
  kafkaStore.fetchTopics();
});

const handleCreateTopic = async (formData) => {
  console.log("View: Tạo topic mới:", formData);
  try {
    const result = await kafkaStore.createTopic(formData);
    console.log("View: Tạo topic thành công, result:", result);

    // Refresh danh sách topics
    console.log("View: Đang fetch lại topics...");
    await kafkaStore.fetchTopics();
    console.log("View: Fetch topics xong, topics hiện tại:", kafkaStore.topics);

    // Reset về trang 1 để thấy topic mới
    currentPage.value = 1;

    // Clear search để thấy tất cả topics
    searchQuery.value = "";

    // Đóng modal
    showCreateTopicModal.value = false;

    // Hiển thị thông báo thành công
    success("Tạo topic thành công!");
  } catch (err) {
    console.error("View: Error in handleCreateTopic:", err);
    error("Lỗi: " + err.message);
  }
};

const openUpdateModal = (topic) => {
  selectedTopic.value = topic;
  showUpdateTopicModal.value = true;
};

const handleUpdateTopic = async (updateData) => {
  try {
    console.log("View: Cập nhật topic:", selectedTopic.value.name, updateData);
    const result = await kafkaStore.updateTopic(
      selectedTopic.value.name,
      updateData
    );
    console.log("View: Cập nhật topic thành công:", result);

    // Đóng modal
    showUpdateTopicModal.value = false;
    selectedTopic.value = null;

    // Hiển thị thông báo thành công
    success("Cập nhật topic thành công!");

    // Refresh danh sách topics
    await kafkaStore.fetchTopics();
  } catch (err) {
    console.error("View: Error in handleUpdateTopic:", err);
    error("Lỗi: " + err.message);
  }
};

const openDeleteModal = (topic) => {
  selectedTopic.value = topic;
  showDeleteTopicModal.value = true;
};

const handleDeleteTopic = async () => {
  try {
    console.log("View: Xóa topic:", selectedTopic.value.name);
    const topicNameToDelete = selectedTopic.value.name;

    const result = await kafkaStore.deleteTopic(topicNameToDelete);
    console.log("View: Xóa topic thành công:", result);

    // Đóng modal ngay
    showDeleteTopicModal.value = false;
    selectedTopic.value = null;

    // Wait thêm 500ms để Kafka xóa hoàn toàn
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Force refresh từ Kafka (không dùng cache)
    console.log("View: Force refresh topics từ Kafka...");
    await kafkaStore.fetchTopics();

    // Reset về trang 1
    currentPage.value = 1;

    // Hiển thị thông báo thành công
    success("Xóa topic thành công!");
  } catch (err) {
    console.error("View: Error in handleDeleteTopic:", err);
    error("Lỗi: " + err.message);
  }
};

// Helper function để format số
const formatNumber = (num) => {
  return num?.toLocaleString() || 0;
};
</script>
