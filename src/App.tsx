import { useFeedbackListener } from "@/hooks/useFeedbackListener";
import { Router } from "@/routes/Router";

export default function App() {
  useFeedbackListener();
  return <Router />;
}
