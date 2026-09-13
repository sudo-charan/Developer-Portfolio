import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Layout from './components/Layout'
import FullPageLoader from './components/FullPageLoader'
import NotFound from './pages/NotFound'
import { AdminSessionProvider } from './admin/context/AdminSessionContext.jsx'
import { AdminCacheProvider } from './admin/context/AdminCacheContext.jsx'
import { UnreadCountProvider } from './admin/context/UnreadCountContext.jsx'

const Home = lazy(() => import('./pages/Home'))
const Blog = lazy(() => import('./pages/Blog'))
const BlogPost = lazy(() => import('./pages/BlogPost'))
const AdminLogin = lazy(() => import('./admin/AdminLogin'))
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminDashboardIndex = lazy(() => import('./admin/pages/Dashboard'))
const ProjectsPage = lazy(() => import('./admin/pages/ProjectsPage'))
const SkillsPage = lazy(() => import('./admin/pages/SkillsPage'))
const ExperiencePage = lazy(() => import('./admin/pages/ExperiencePage'))
const EducationPage = lazy(() => import('./admin/pages/EducationPage'))
const CertificatesPage = lazy(() => import('./admin/pages/CertificatesPage'))
const CurrentWorkPage = lazy(() => import('./admin/pages/CurrentWorkPage'))
const BlogPage = lazy(() => import('./admin/pages/BlogPage'))
const MessagesPage = lazy(() => import('./admin/pages/MessagesPage'))
const SettingsPage = lazy(() => import('./admin/pages/SettingsPage'))

function AdminSessionLayout() {
  return (
    <AdminSessionProvider>
      <Outlet />
    </AdminSessionProvider>
  )
}

export default function App() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:id" element={<BlogPost />} />
        </Route>

        <Route element={<AdminSessionLayout />}>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminCacheProvider>
                <UnreadCountProvider>
                  <AdminLayout />
                </UnreadCountProvider>
              </AdminCacheProvider>
            }
          >
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
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
