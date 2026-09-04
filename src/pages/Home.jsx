import { useSiteContent, useProjects, useSkills, useExperience, useEducation, useCertificates, useCurrentWork, useSettings } from '../hooks/useFirestore'
import { lazy, Suspense, useEffect } from 'react'
import Hero from './sections/Hero'
import About from './sections/About'
import HowIWork from './sections/HowIWork'
import Footer from '../components/Footer'

const Projects = lazy(() => import('./sections/Projects'))
const Skills = lazy(() => import('./sections/Skills'))
const Experience = lazy(() => import('./sections/Experience'))
const Education = lazy(() => import('./sections/Education'))
const Certificates = lazy(() => import('./sections/Certificates'))
const CurrentWork = lazy(() => import('./sections/CurrentWork'))
const Contact = lazy(() => import('./sections/Contact'))

function SectionSkeleton() {
  return <div className="py-24 px-4"><div className="max-w-6xl mx-auto" /></div>
}

export default function Home() {
  useEffect(() => {
    const prefetch = async () => {
      try {
        if ('requestIdleCallback' in window) {
          await new Promise(resolve => window.requestIdleCallback(resolve, { timeout: 2000 }))
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        const modules = [
          import('./sections/Projects'),
          import('./sections/Skills'),
          import('./sections/Experience'),
          import('./sections/Education'),
          import('./sections/Certificates'),
          import('./sections/CurrentWork'),
          import('./sections/Contact'),
        ]
        await Promise.allSettled(modules)
      } catch {
        // ignore prefetch errors
      }
    }
    prefetch()
  }, [])

  const { data: siteContent, loading: _contentLoading, error: _contentError, retry: _retryContent } = useSiteContent()
  const { data: projects, loading: projectsLoading, error: _projectsError, retry: _retryProjects } = useProjects()
  const { data: skills, loading: skillsLoading, error: _skillsError } = useSkills({ defer: 100 })
  const { data: experience, loading: expLoading, error: _expError } = useExperience({ defer: 150 })
  const { data: education, loading: eduLoading, error: _eduError } = useEducation({ defer: 200 })
  const { data: certificates, loading: certLoading, error: _certError } = useCertificates({ defer: 250 })
  const { data: currentWork, loading: workLoading, error: _workError } = useCurrentWork({ defer: 300 })
  const { data: settings } = useSettings()

  return (
    <>
      <Hero content={siteContent} resumeUrl={settings?.resumeUrl} settings={settings} />
      <About content={siteContent} settings={settings} />
      <HowIWork />
      <Suspense fallback={<SectionSkeleton />}>
        <Projects projects={projects || []} loading={projectsLoading} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Skills skills={skills || []} loading={skillsLoading} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Experience experiences={experience || []} loading={expLoading} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Education education={education || []} loading={eduLoading} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Certificates certificates={certificates || []} loading={certLoading} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CurrentWork currentWork={currentWork || []} loading={workLoading} />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <Contact settings={settings} />
      </Suspense>
      <Footer settings={settings} />
    </>
  )
}
