import GenericCRUD from '../components/GenericCRUD'
import { getEducation } from '../../firebase/services'
import { addEducation, updateEducation, deleteEducation, reorderItems } from '../../firebase/adminServices'

const fields = [
  { name: 'degree', label: 'Degree', required: true },
  { name: 'branch', label: 'Branch / Specialization', required: false },
  { name: 'institution', label: 'Institution', required: true },
  { name: 'location', label: 'Location', required: true },
  { name: 'startYear', label: 'Start Year', required: true },
  { name: 'endYear', label: 'End Year', required: true },
  { name: 'grade', label: 'CGPA / Percentage', required: false },
  { name: 'description', label: 'Description', type: 'textarea', required: false },
]

const renderEducationItem = (item) => {
  const yearRange = item.startYear
    ? `${item.startYear} — ${item.endYear || 'Present'}`
    : (item.endYear || '')
  const meta = [item.institution, item.location].filter(Boolean).join(' • ')
  const gradeLine = item.grade ? `Grade: ${item.grade}` : null

  return (
    <div>
      <h3 className="font-semibold text-sm">{item.degree || 'Untitled'}</h3>
      {item.branch && (
        <p className="text-text-secondary text-xs">{item.branch}</p>
      )}
      {meta && (
        <p className="text-text-muted text-xs font-mono mt-1">{meta}</p>
      )}
      {yearRange && (
        <p className="text-text-muted text-xs font-mono">{yearRange}</p>
      )}
      {gradeLine && (
        <p className="text-text-muted text-xs font-mono">{gradeLine}</p>
      )}
    </div>
  )
}

export default function EducationPage() {
  return (
    <GenericCRUD
      title="Education"
      fields={fields}
      fetcher={getEducation}
      adder={addEducation}
      updater={updateEducation}
      remover={deleteEducation}
      reorderer={(orderPairs) => reorderItems('education', orderPairs)}
      cacheKey="admin_education"
      titleField="degree"
      subtitleField="institution"
      renderItem={renderEducationItem}
    />
  )
}
