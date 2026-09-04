import { useSiteContent, useProjects, useSkills, useExperience, useEducation, useCertificates, useCurrentWork, useSettings } from '../hooks/useFirestore'
import Hero from './sections/Hero'
import About from './sections/About'
import HowIWork from './sections/HowIWork'
import Projects from './sections/Projects'
import Skills from './sections/Skills'
import Experience from './sections/Experience'
import Education from './sections/Education'
import Certificates from './sections/Certificates'
import CurrentWork from './sections/CurrentWork'
import Contact from './sections/Contact'
import Footer from '../components/Footer'
import Loader from '../components/Loader'

export default function Home() {
  const { data: siteContent, loading: contentLoading, error: _contentError, retry: _retryContent } = useSiteContent()
  const { data: projects, loading: projectsLoading, error: _projectsError, retry: _retryProjects } = useProjects()
  const { data: skills, loading: skillsLoading, error: _skillsError } = useSkills()
  const { data: experience, loading: expLoading, error: _expError } = useExperience()
  const { data: education, loading: eduLoading, error: _eduError } = useEducation()
  const { data: certificates, loading: certLoading, error: _certError } = useCertificates()
  const { data: currentWork, loading: workLoading, error: _workError } = useCurrentWork()
  const { data: settings } = useSettings()

  const isLoading = contentLoading || projectsLoading || skillsLoading || expLoading || eduLoading || certLoading || workLoading

  if (isLoading) {
    return <Loader size={48} label="Loading page..." mode="full-page" />
  }

  return (
    <>
      <Hero content={siteContent} resumeUrl={settings?.resumeUrl} settings={settings} />
      <About content={siteContent} settings={settings} />
      <HowIWork />
      <Projects projects={projects || []} />
      <Skills skills={skills || []} />
      <Experience experiences={experience || []} />
      <Education education={education || []} />
      <Certificates certificates={certificates || []} />
      <CurrentWork currentWork={currentWork || []} />
      <Contact settings={settings} />
      <Footer settings={settings} />
    </>
  )
}
