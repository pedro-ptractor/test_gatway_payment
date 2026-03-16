import { useState, useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Plans } from './pages/Plans';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { CheckoutCancel } from './pages/CheckoutCancel';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { isAuthenticated, logout } from './lib/api';
import './App.css';

const queryClient = new QueryClient();

function Nav() {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => isAuthenticated());

  const handleLoginSuccess = useCallback(() => setToken(true), []);
  const handleLogout = useCallback(() => {
    logout();
    setToken(false);
    navigate('/login');
  }, [navigate]);

  return (
    <>
      <nav style={{ padding: '12px 24px', borderBottom: '1px solid #eee' }}>
        <Link to="/">Início</Link>
        <span style={{ margin: '0 12px' }}>|</span>
        <Link to="/plans">Planos</Link>
        <span style={{ margin: '0 12px' }}>|</span>
        {token ? (
          <button type="button" onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'inherit', textDecoration: 'underline' }}>
            Sair
          </button>
        ) : (
          <Link to="/login">Entrar</Link>
        )}
      </nav>
      <Routes>
        <Route path="/" element={<div style={{ padding: 24 }}><h1>Bem-vindo</h1><Link to="/plans">Ver planos</Link></div>} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Nav />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
