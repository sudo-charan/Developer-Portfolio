import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'
import NotFound from './pages/NotFound'
import { AdminCacheProvider } from './admin/context/AdminCacheContext.jsx'

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

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <Suspense fallback={<PageLoader />}>
            <Home />
          </Suspense>
        } />
        <Route path="blog" element={
          <Suspense fallback={<PageLoader />}>
            <Blog />
          </Suspense>
        } />
        <Route path="blog/:id" element={
          <Suspense fallback={<PageLoader />}>
            <BlogPost />
          </Suspense>
        } />
      </Route>
      <Route path="/admin/login" element={
        <Suspense fallback={<PageLoader />}>
          <AdminLogin />
        </Suspense>
      } />
      <Route path="/admin" element={
        <Suspense fallback={<PageLoader />}>
          <AdminCacheProvider>
            <AdminLayout />
          </AdminCacheProvider>
        </Suspense>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<PageLoader />}>
            <AdminDashboardIndex />
          </Suspense>
        } />
        <Route path="projects" element={
          <Suspense fallback={<PageLoader />}>
            <ProjectsPage />
          </Suspense>
        } />
        <Route path="skills" element={
          <Suspense fallback={<PageLoader />}>
            <SkillsPage />
          </Suspense>
        } />
        <Route path="experience" element={
          <Suspense fallback={<PageLoader />}>
            <ExperiencePage />
          </Suspense>
        } />
        <Route path="education" element={
          <Suspense fallback={<PageLoader />}>
            <EducationPage />
          </Suspense>
        } />
        <Route path="certificates" element={
          <Suspense fallback={<PageLoader />}>
            <CertificatesPage />
          </Suspense>
        } />
        <Route path="current-work" element={
          <Suspense fallback={<PageLoader />}>
            <CurrentWorkPage />
          </Suspense>
        } />
        <Route path="blog" element={
          <Suspense fallback={<PageLoader />}>
            <BlogPage />
          </Suspense>
        } />
        <Route path="messages" element={
          <Suspense fallback={<PageLoader />}>
            <MessagesPage />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        } />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
