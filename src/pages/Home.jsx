import { useSiteContent, useProjects, useSkills, useExperience, useEducation, useCertificates, useCurrentWork } from '../hooks/useFirestore'
import { lazy, Suspense } from 'react'
import { useOutletContext } from 'react-router-dom'
import Hero from './sections/Hero'
import About from './sections/About'
import HowIWork from './sections/HowIWork'
import Footer from '../components/Footer'
import usePageMetadata, { SITE_ORIGIN } from '../hooks/usePageMetadata'

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
  const { data: siteContent } = useSiteContent()
  const { settings } = useOutletContext() || {}
  const { data: projects, loading: projectsLoading } = useProjects()
  const { data: skills, loading: skillsLoading } = useSkills({ defer: 100 })
  const { data: experience, loading: expLoading } = useExperience({ defer: 150 })
  const { data: education, loading: eduLoading } = useEducation({ defer: 200 })
  const { data: certificates, loading: certLoading } = useCertificates({ defer: 250 })
  const { data: currentWork, loading: workLoading } = useCurrentWork({ defer: 300 })
  const hero = settings?.hero || siteContent?.hero || {}
  const name = hero.name || 'Charanraj M'
  const title = hero.title || 'Full-Stack Developer · Cybersecurity Enthusiast · ISE Student'
  const description = hero.description ||
    'Building practical software, exploring AI and cybersecurity, and continuously learning new technologies.'
  const sameAs = Object.values(settings?.socialLinks || {}).filter(
    (url) => typeof url === 'string' && url.startsWith('https://'),
  )

  usePageMetadata({
    title: `${name} | Full-Stack Developer`,
    description,
    path: '/',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name,
      jobTitle: title,
      url: SITE_ORIGIN,
      sameAs,
    },
  })

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
