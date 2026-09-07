import GenericCRUD from '../components/GenericCRUD'
import { getCertificates } from '../../firebase/services'
import { addCertificate, updateCertificate, deleteCertificate, reorderItems } from '../../firebase/adminServices'

const fields = [
  { name: 'name', label: 'Certificate Name', required: true },
  { name: 'issuer', label: 'Issuing Organization', required: true },
  { name: 'year', label: 'Year', required: true },
  { name: 'category', label: 'Category', required: true },
  { name: 'verifyUrl', label: 'Verification URL', type: 'url' },
  { name: 'image', label: 'Image URL', type: 'url' },
]

export default function CertificatesPage() {
  return (
    <GenericCRUD
      title="Certificates"
      fields={fields}
      fetcher={getCertificates}
      adder={addCertificate}
      updater={updateCertificate}
      remover={deleteCertificate}
      reorderer={(orderPairs) => reorderItems('certificates', orderPairs)}
      cacheKey="admin_certificates"
      titleField="name"
      subtitleField="issuer"
    />
  )
}
