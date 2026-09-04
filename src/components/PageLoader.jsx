import Loader from './Loader'

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader size={48} label="Loading..." />
    </div>
  )
}
