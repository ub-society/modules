import DefaultTheme from "vitepress/theme";
import "./custom.css";
import "katex/dist/katex.min.css";
import { setupMermaidFullscreen } from "./mermaid-modal";

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        setupMermaidFullscreen();
      }, 200);

      router.onAfterRouteChanged = () => {
        setTimeout(() => {
          setupMermaidFullscreen();
        }, 200);
      };
    }
  },
};
