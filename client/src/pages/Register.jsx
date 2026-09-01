import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { useTheme } from '../theme/ThemeContext.jsx';
import AuthLayout from '../backgrounds/AuthLayout.jsx';

export default function Register() {
    const { register } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await register({ displayName, username, password });
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthLayout>
            <h1 className="font-display text-2xl font-black uppercase text-center mb-1" style={{ color: 'var(--auth-text)' }}>
                {theme.headerEmoji} {theme.appName}
            </h1>
            <p className="text-center text-sm font-semibold mb-6" style={{ color: 'var(--auth-text-muted)' }}>
                Crea tu cuenta para tu Fiestas Patrias
            </p>

            {error && (
                <p className="text-sm font-semibold nb-border rounded-lg px-3 py-2 mb-4" style={{ background: '#fdecea', color: '#c0392b' }}>
                    {error}
                </p>
            )}

            <form onSubmit={onSubmit} className="flex flex-col gap-3">
                <label className="text-xs font-black uppercase" style={{ color: 'var(--auth-text)' }}>
                    Nombre
                </label>
                <input
                    className="nb-border rounded-lg px-3 py-2 font-semibold"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoFocus
                />
                <label className="text-xs font-black uppercase" style={{ color: 'var(--auth-text)' }}>
                    Usuario único
                </label>
                <input
                    className="nb-border rounded-lg px-3 py-2 font-semibold"
                    placeholder="sin espacios, 3-20 caracteres"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <label className="text-xs font-black uppercase" style={{ color: 'var(--auth-text)' }}>
                    Contraseña
                </label>
                <input
                    type="password"
                    className="nb-border rounded-lg px-3 py-2 font-semibold"
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button
                    disabled={busy}
                    className="mt-4 nb-border nb-shadow rounded-lg py-3 font-black uppercase text-white transition active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                    style={{ background: 'var(--auth-accent)' }}
                >
                    {busy ? 'Creando…' : 'Crear cuenta'}
                </button>
            </form>

            <p className="text-center text-sm font-semibold mt-5" style={{ color: 'var(--auth-text-muted)' }}>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="font-black underline" style={{ color: 'var(--auth-accent)' }}>
                    Inicia sesión
                </Link>
            </p>
        </AuthLayout>
    );
}
