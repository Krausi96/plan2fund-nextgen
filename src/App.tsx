import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RecoPage from "./pages/RecoPage";
import PlanPage from "./pages/PlanPage";
import ReadinessPage from "./pages/ReadinessPage";
import PreviewPage from "./pages/PreviewPage";
import PricingPage from "./pages/PricingPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import AfterSalesPage from "./pages/AfterSalesPage";
import AiPlanPage from "./pages/AiPlanPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/reco" element={<RecoPage />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/readiness" element={<ReadinessPage />} />
      <Route path="/preview" element={<PreviewPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/confirm" element={<ConfirmationPage />} />
      <Route path="/aftersales" element={<AfterSalesPage />} />
      <Route path="/ai" element={<AiPlanPage />} />
    </Routes>
  );
}
