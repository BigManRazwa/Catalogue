import { Routes, Route } from 'react-router-dom'
import Catalogue from './pages/Catalogue'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Catalogue />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
