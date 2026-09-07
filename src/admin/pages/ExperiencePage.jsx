import GenericCRUD from '../components/GenericCRUD'
import { getExperience } from '../../firebase/services'
import { addExperience, updateExperience, deleteExperience, reorderItems } from '../../firebase/adminServices'

const fields = [
  { name: 'title', label: 'Job Title', required: true },
  { name: 'company', label: 'Company', required: true },
  { name: 'location', label: 'Location', required: true },
  { name: 'startDate', label: 'Start Date', required: true },
  { name: 'endDate', label: 'End Date' },
  { name: 'description', label: 'Description', type: 'textarea', required: true },
]

export default function ExperiencePage() {
  return (
    <GenericCRUD
      title="Experience"
      fields={fields}
      fetcher={getExperience}
      adder={addExperience}
      updater={updateExperience}
      remover={deleteExperience}
      reorderer={(orderPairs) => reorderItems('experience', orderPairs)}
      cacheKey="admin_experience"
      titleField="title"
      subtitleField="company"
    />
  )
}
