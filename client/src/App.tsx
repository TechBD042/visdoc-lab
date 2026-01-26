import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Process from './pages/Process'
import Layout from './components/Layout'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/process/:id" element={<Process />} />
      </Routes>
    </Layout>
  )
}

export default App
