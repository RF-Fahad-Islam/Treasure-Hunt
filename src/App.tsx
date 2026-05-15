import { useFeedbackListener } from "@/hooks/useFeedbackListener";
import { Router } from "@/routes/Router";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  useFeedbackListener();
  return (
    <>
      <Router />
      <Analytics />
    </>
  );
}
