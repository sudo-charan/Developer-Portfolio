import Loader from './Loader'

export default function PageLoader({ label = 'Loading...' }) {
  return <Loader size={48} label={label} mode="full-page" />
}
