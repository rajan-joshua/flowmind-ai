import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import CommandCenter from './pages/CommandCenter'
import CityMap from './pages/CityMap'
import SimulationStudio from './pages/SimulationStudio'
import ResourcePlanner from './pages/ResourcePlanner'
import Analytics from './pages/Analytics'
import Assistant from './pages/Assistant'
import XAI from './pages/XAI'
import Compare from './pages/Compare'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: '64px' }}>
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<CommandCenter />} />
              <Route path="/map" element={<CityMap />} />
              <Route path="/simulation" element={<SimulationStudio />} />
              <Route path="/resources" element={<ResourcePlanner />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/assistant" element={<Assistant />} />
              <Route path="/xai" element={<XAI />} />
              <Route path="/compare" element={<Compare />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
