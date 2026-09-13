import Loader from './Loader'

export default function FullPageLoader({ label = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark-bg text-text-primary">
      <Loader size={48} label={label} />
    </div>
  )
}
