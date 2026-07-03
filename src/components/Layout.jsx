import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="layout">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark">♪</span>
            <span className="brand-name">Cue Tracker</span>
          </div>
          <nav className="nav">
            <NavLink to="/cues" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Cues
            </NavLink>
            <NavLink to="/batches" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Batches
            </NavLink>
          </nav>
          <div className="account">
            <span className="account-email" title={user?.email}>
              {user?.email}
            </span>
            <button className="btn btn-ghost" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
