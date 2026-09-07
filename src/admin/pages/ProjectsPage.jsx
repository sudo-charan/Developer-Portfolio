import GenericCRUD from '../components/GenericCRUD'
import { getProjects } from '../../firebase/services'
import { addProject, updateProject, deleteProject, reorderItems } from '../../firebase/adminServices'

const fields = [
  { name: 'name', label: 'Project Name', required: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true },
  { name: 'github', label: 'GitHub URL', type: 'url' },
  { name: 'demo', label: 'Live Demo URL', type: 'url' },
  { name: 'image', label: 'Image URL', type: 'url' },
  { name: 'tags', label: 'Tags (comma-separated)' },
  { name: 'status', label: 'Status' },
  { name: 'featured', label: 'Featured', type: 'checkbox' },
]

export default function ProjectsPage() {
  return (
    <GenericCRUD
      title="Projects"
      fields={fields}
      fetcher={getProjects}
      adder={addProject}
      updater={updateProject}
      remover={deleteProject}
      reorderer={(orderPairs) => reorderItems('projects', orderPairs)}
      cacheKey="admin_projects"
      titleField="name"
      subtitleField="description"
    />
  )
}
