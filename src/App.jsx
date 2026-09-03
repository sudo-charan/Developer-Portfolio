import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import AdminLogin from './admin/AdminLogin'
import AdminLayout from './admin/AdminLayout'
import AdminDashboardIndex from './admin/pages/Dashboard'
import ProjectsPage from './admin/pages/ProjectsPage'
import SkillsPage from './admin/pages/SkillsPage'
import ExperiencePage from './admin/pages/ExperiencePage'
import EducationPage from './admin/pages/EducationPage'
import CertificatesPage from './admin/pages/CertificatesPage'
import CurrentWorkPage from './admin/pages/CurrentWorkPage'
import BlogPage from './admin/pages/BlogPage'
import MessagesPage from './admin/pages/MessagesPage'
import SettingsPage from './admin/pages/SettingsPage'
import { AdminCacheProvider } from './admin/context/AdminCacheContext.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="blog" element={<Blog />} />
        <Route path="blog/:id" element={<BlogPost />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminCacheProvider><AdminLayout /></AdminCacheProvider>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardIndex />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="skills" element={<SkillsPage />} />
        <Route path="experience" element={<ExperiencePage />} />
        <Route path="education" element={<EducationPage />} />
        <Route path="certificates" element={<CertificatesPage />} />
        <Route path="current-work" element={<CurrentWorkPage />} />
        <Route path="blog" element={<BlogPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
