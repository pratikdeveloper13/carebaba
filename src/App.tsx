import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SettingsProvider } from './hooks/useSettings'
import { ToastProvider } from './hooks/useToast'
import { BottomNav } from './components/common/BottomNav'
import { LoadingSpinner } from './components/common/LoadingSpinner'
import { initCloudSync } from './services/sync/cloudSyncService'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { AddMenu } from './pages/AddReading/AddMenu'
import { AddSugar } from './pages/AddReading/AddSugar'
import { AddBP } from './pages/AddReading/AddBP'
import { AddSpo2 } from './pages/AddReading/AddSpo2'
import { History } from './pages/History/History'
import { Vaccines } from './pages/Vaccines/Vaccines'
import { VaccineHistory } from './pages/Vaccines/VaccineHistory'
import { AddVaccine } from './pages/Vaccines/AddVaccine'
import { Settings } from './pages/Settings/Settings'

// The Trends page pulls in recharts, the single heaviest dependency in the
// app — lazy-load it so the dashboard (the screen opened most often, by an
// elderly user, possibly on a slow connection) stays fast to first paint.
const Trends = lazy(() => import('./pages/Trends/Trends').then((m) => ({ default: m.Trends })))

export default function App() {
  useEffect(() => {
    initCloudSync()
  }, [])

  return (
    <SettingsProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add" element={<AddMenu />} />
              <Route path="/add/sugar" element={<AddSugar />} />
              <Route path="/add/bp" element={<AddBP />} />
              <Route path="/add/spo2" element={<AddSpo2 />} />
              <Route path="/edit/sugar/:id" element={<AddSugar />} />
              <Route path="/edit/bp/:id" element={<AddBP />} />
              <Route path="/edit/spo2/:id" element={<AddSpo2 />} />
              <Route path="/history" element={<History />} />
              <Route
                path="/trends"
                element={
                  <Suspense fallback={<LoadingSpinner />}>
                    <Trends />
                  </Suspense>
                }
              />
              <Route path="/vaccines" element={<Vaccines />} />
              <Route path="/vaccines/add" element={<AddVaccine />} />
              <Route path="/vaccines/edit/:id" element={<AddVaccine />} />
              <Route path="/vaccines/history" element={<VaccineHistory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <BottomNav />
        </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
  )
}
