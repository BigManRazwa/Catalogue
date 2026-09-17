import { Routes, Route } from 'react-router-dom'
import Catalogue from './pages/Catalogue'
import Admin from './pages/Admin'
import ProductDetail from './pages/ProductDetail'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Catalogue />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  )
}
