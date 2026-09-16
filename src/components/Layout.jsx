import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()

  return (
    <div className="app">
      <nav className="nav" aria-label="Navegação principal">
        <div className="nav__inner">
          <Link to="/" className="nav__brand">
            Salões Comerciais
          </Link>
          <div className="nav__links">
            <Link
              to="/"
              className={`nav__link${location.pathname === '/' ? ' nav__link--active' : ''}`}
            >
              Imóveis
            </Link>
            <Link
              to="/imoveis/novo"
              className={`nav__link${location.pathname === '/imoveis/novo' ? ' nav__link--active' : ''}`}
            >
              Cadastrar imóvel
            </Link>
          </div>
        </div>
      </nav>
      <Outlet />
    </div>
  )
}
