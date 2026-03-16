import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../lib/api';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>
      <h1>Criar conta</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Nome</span>
          <input
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete='name'
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>E-mail</span>
          <input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete='email'
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span>Senha (mín. 8 caracteres)</span>
          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete='new-password'
            style={{ padding: 8, fontSize: 16 }}
          />
        </label>
        {error && (
          <p style={{ color: 'red', margin: 0, fontSize: 14 }}>{error}</p>
        )}
        <button
          type='submit'
          disabled={loading}
          style={{
            padding: 12,
            fontSize: 16,
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
        Já tem conta? <Link to='/login'>Entrar</Link>
      </p>
    </div>
  );
}
