import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import RecoPage from "./pages/RecoPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/reco" element={<RecoPage />} />
      </Routes>
    </BrowserRouter>
  );
}
