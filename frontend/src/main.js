import { createApp } from "vue";
import { createPinia } from "pinia"; // Import Pinia
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

// Suppress Chrome extension errors
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Unchecked runtime.lastError")
  ) {
    return; // Ignore this specific error
  }
  originalError.apply(console, args);
};

const app = createApp(App);
const pinia = createPinia(); // Tạo instance Pinia

app.use(router);
app.use(pinia); // Sử dụng Pinia
app.mount("#app");
