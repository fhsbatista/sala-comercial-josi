import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import NewPropertyPage from './pages/NewPropertyPage.jsx'
import PropertyDetailsPage from './pages/PropertyDetailsPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="imoveis/novo" element={<NewPropertyPage />} />
          <Route path="imoveis/:id" element={<PropertyDetailsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
