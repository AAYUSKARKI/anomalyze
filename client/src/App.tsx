import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import AuthPage from "./pages/AuthPage"
import AppLayout from "./components/AppLayout"
import DataIngestion from "./components/DataIngestion"
import MultiChannelView from "./pages/MultiChannelView"
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<AppLayout />}>
        <Route index element={<DataIngestion />} />
        <Route path="multichannel" element={<MultiChannelView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App