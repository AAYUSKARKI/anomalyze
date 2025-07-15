import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import AuthPage from "./pages/AuthPage"
import AppLayout from "./components/AppLayout"
import DataIngestion from "./components/DataIngestion"
import MultiChannelView from "./pages/MultiChannelView"
import ModelTraining from "./pages/ModelTraining"
import LiveSocketListener from "./components/LiveSocketListener"
import Analytics from "./pages/Analytics"
import Alerts from "./pages/Alert"
import FMEA from "./pages/FMEA"
function App() {
  return (
    <BrowserRouter>
      <LiveSocketListener />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<AppLayout />}>
        <Route index element={<DataIngestion />} />
        <Route path="multichannel" element={<MultiChannelView />} />
        <Route path="model-training" element={<ModelTraining />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="alerts" element={<Alerts />} />
        <Route path="fmea" element={<FMEA />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App