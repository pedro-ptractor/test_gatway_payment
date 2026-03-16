import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../lib/api';

type LoginProps = {
  onLoginSuccess?: () => void;
};

export function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onLoginSuccess?.();
      navigate('/plans', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <h1>Entrar</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="current-password"
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>
        {error && (
          <p style={{ color: 'red', margin: 0, fontSize: 14 }}>{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: 12, fontSize: 16, cursor: loading ? 'wait' : 'pointer' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
        Ainda não tem conta? <Link to="/register">Criar conta</Link>
      </p>
    </div>
  );
}
