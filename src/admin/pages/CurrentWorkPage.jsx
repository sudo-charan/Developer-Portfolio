import GenericCRUD from '../components/GenericCRUD'
import { getCurrentWork } from '../../firebase/services'
import { addCurrentWork, updateCurrentWork, deleteCurrentWork, reorderItems } from '../../firebase/adminServices'

const fields = [
  { name: 'title', label: 'Title', required: true },
  { name: 'description', label: 'Description', type: 'textarea', required: true },
  { name: 'status', label: 'Status', required: true },
]

export default function CurrentWorkPage() {
  return (
    <GenericCRUD
      title="Current Work"
      fields={fields}
      fetcher={getCurrentWork}
      adder={addCurrentWork}
      updater={updateCurrentWork}
      remover={deleteCurrentWork}
      reorderer={(orderPairs) => reorderItems('currentWork', orderPairs)}
      cacheKey="admin_current_work"
      titleField="title"
      subtitleField="status"
    />
  )
}
