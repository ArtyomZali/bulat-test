import { createApp } from "vue";
import { createPinia } from "pinia";
import VNetworkGraph from "v-network-graph";
import "v-network-graph/lib/style.css";
import { registerPlugins } from "@/plugins";
import App from "./App.vue";

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(VNetworkGraph);
registerPlugins(app);
app.mount("#app");
