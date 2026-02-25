import "./App.css";
import { Route, Routes } from "react-router";
import { AppContent } from "./components/AppContent";
import { AboutPage } from "./pages/AboutPage";
import { InstrumentsPage } from "./pages/InstrumentsPage";
import { MonitoringPage } from "./pages/MonitoringPage";

export function App() {
  console.log("!!! APP RENDER !!!");
  return (
    <>
      <Routes>
        <Route element={<AppContent />}>
          <Route index path={PREFIX} element={<InstrumentsPage />} />
          <Route path={PREFIX + "details"}>
            <Route index element={<InstrumentsPage />} />
            <Route path=":symbol" element={<InstrumentsPage />} />
          </Route>
          <Route path={PREFIX + "monitoring"} element={<MonitoringPage />} />
          <Route path={PREFIX + "about"} element={<AboutPage />} />
        </Route>
        <Route path="*" element={<div>404: Страница не найдена</div>} />
      </Routes>
    </>
  );
}
