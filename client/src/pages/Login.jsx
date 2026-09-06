import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import { useTheme } from '../theme/ThemeContext.jsx';
import AuthLayout from '../backgrounds/AuthLayout.jsx';

export default function Login() {
    const { login, register } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [step, setStep] = useState('username'); // 'username' | 'login' | 'register'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    function backToUsername() {
        setStep('username');
        setPassword('');
        setError('');
    }

    async function onContinue(e) {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            const { exists } = await api.checkUsername(username.trim());
            setStep(exists ? 'login' : 'register');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function onLogin(e) {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await login({ username, password });
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function onRegister(e) {
        e.preventDefault();
        setError('');
        setBusy(true);
        try {
            await register({ username, password });
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
                {step === 'register' ? 'Crea tu cuenta para tus Fiestas Patrias' : 'Entra para seguir contando'}
            </p>

            {error && (
                <p className="text-sm font-semibold nb-border rounded-lg px-3 py-2 mb-4" style={{ background: '#fdecea', color: '#c0392b' }}>
                    {error}
                </p>
            )}

            {step === 'username' && (
                <form onSubmit={onContinue} className="flex flex-col gap-3">
                    <label className="text-xs font-black uppercase" style={{ color: 'var(--auth-text)' }}>
                        Usuario
                    </label>
                    <input
                        className="nb-border rounded-lg px-3 py-2 font-semibold"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        autoFocus
                    />
                    <button
                        disabled={busy}
                        className="mt-4 nb-border nb-shadow rounded-lg py-3 font-black uppercase text-white transition active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                        style={{ background: 'var(--auth-accent)' }}
                    >
                        {busy ? 'Un momento…' : 'Continuar'}
                    </button>
                </form>
            )}

            {step !== 'username' && (
                <form onSubmit={step === 'login' ? onLogin : onRegister} className="flex flex-col gap-3">
                    <p className="text-sm font-semibold" style={{ color: 'var(--auth-text)' }}>
                        Usuario: <span className="font-black">{username}</span>{' '}
                        <button type="button" onClick={backToUsername} className="underline font-black" style={{ color: 'var(--auth-accent)' }}>
                            cambiar
                        </button>
                    </p>

                    <label className="text-xs font-black uppercase" style={{ color: 'var(--auth-text)' }}>
                        Contraseña
                    </label>
                    <input
                        type="password"
                        className="nb-border rounded-lg px-3 py-2 font-semibold"
                        minLength={step === 'register' ? 6 : undefined}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoFocus
                    />

                    <button
                        disabled={busy}
                        className="mt-4 nb-border nb-shadow rounded-lg py-3 font-black uppercase text-white transition active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
                        style={{ background: 'var(--auth-accent)' }}
                    >
                        {busy ? 'Un momento…' : step === 'register' ? 'Crear cuenta y entrar' : 'Entrar'}
                    </button>
                </form>
            )}
        </AuthLayout>
    );
}
