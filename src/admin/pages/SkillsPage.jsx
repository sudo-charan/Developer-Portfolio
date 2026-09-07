import GenericCRUD from '../components/GenericCRUD'
import { getSkills } from '../../firebase/services'
import { addSkill, updateSkill, deleteSkill, reorderItems } from '../../firebase/adminServices'

const fields = [
  { name: 'name', label: 'Skill Name', required: true },
  { name: 'group', label: 'Group', required: true },
]

export default function SkillsPage() {
  return (
    <GenericCRUD
      title="Skills"
      fields={fields}
      fetcher={getSkills}
      adder={addSkill}
      updater={updateSkill}
      remover={deleteSkill}
      reorderer={(orderPairs) => reorderItems('skills', orderPairs)}
      cacheKey="admin_skills"
      titleField="name"
      subtitleField="group"
    />
  )
}
