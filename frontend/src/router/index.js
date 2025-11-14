import { createRouter, createWebHashHistory } from "vue-router";

// Import Layouts
import MainLayout from "../layouts/MainLayout.vue";

// Import Views
import DashboardView from "../views/DashboardView.vue";
import ProducerDashboardView from "../views/ProducerDashboardView.vue";
import ConsumerDashboardView from "../views/ConsumerDashboardView.vue";
import ConfigurationView from "../views/ConfigurationView.vue";
import TopicListView from "../views/TopicListView.vue";
import ConsumerListView from "../views/ConsumerListView.vue";
import AutoSendView from "../views/AutoSendView.vue";
import TopicDetailView from "../views/TopicDetailView.vue";
import DebugLogsView from "../views/DebugLogsView.vue";

const routes = [
  {
    path: "/",
    component: MainLayout, // Layout chung (Sidebar, Header)
    redirect: "/dashboard",
    children: [
      // Route cho Dashboard
      {
        path: "dashboard",
        component: DashboardView,
        meta: { title: "Dashboard" },
      },
      // Route cho Producer Dashboard
      {
        path: "producer-dashboard",
        component: ProducerDashboardView,
        meta: { title: "Producer Dashboard" },
      },
      // Route cho Consumer Dashboard
      {
        path: "consumer-dashboard",
        component: ConsumerDashboardView,
        meta: { title: "Consumer Dashboard" },
      },
      // Route cho Debug Logs
      {
        path: "debug-logs",
        component: DebugLogsView,
        meta: { title: "Debug Logs" },
      },
      // Route cha cho các trang Cấu hình
      {
        // SỬA: Đổi tên path từ 'config' thành 'configuration'
        // để khớp với thiết kế (ví dụ: /configuration/topics)
        path: "configuration",
        component: ConfigurationView, // Component chứa 3 tab chính
        redirect: "/configuration/topics",
        children: [
          {
            path: "topics",
            component: TopicListView,
            meta: { title: "Quản lý Topic" },
          },
          // SỬA: Thêm route chi tiết topic VÀO ĐÂY
          // Nó phải là con của ConfigurationView
          {
            path: "topics/:topicName",
            component: TopicDetailView,
            meta: { title: "Chi tiết Topic" },
          },
          {
            path: "consumers",
            component: ConsumerListView,
            meta: { title: "Quản lý Consumer" },
          },
          {
            path: "auto-send",
            component: AutoSendView,
            meta: { title: "Gửi tự động" },
          },
        ],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// Cập nhật tiêu đề của tab trình duyệt
router.beforeEach((to, from, next) => {
  document.title = `Kafka Manager - ${to.meta.title || "Dashboard"}`;
  next();
});

export default router;
