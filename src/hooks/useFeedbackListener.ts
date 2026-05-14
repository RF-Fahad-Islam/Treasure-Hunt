import { useEffect } from "react";
import { lightClick, heavyClick, confirmSound, successSound, errorSound } from "@/utils/feedback";

export function useFeedbackListener() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "button, [data-sound], .btn-press, .touch-press, .ripple"
      );
      if (!target) return;
      const sound = target.getAttribute("data-sound");
      switch (sound) {
        case "heavy":   heavyClick(); return;
        case "confirm": confirmSound(); return;
        case "success": successSound(); return;
        case "error":   errorSound(); return;
      }
      lightClick();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
}
