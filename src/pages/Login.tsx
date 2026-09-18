import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login, signup, loginWithGoogle, resetPassword, error } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        navigate('/');
      } else if (mode === 'signup') {
        await signup(email, password, name);
        navigate('/');
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err: any) {
      setLocalError(humanizeAuthError(err?.message || 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setLocalError(null);
    setBusy(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setLocalError(humanizeAuthError(err?.message || 'Something went wrong'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-ink">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="heading-serif text-3xl text-paper">
            ESTER <span className="text-rose">❤</span> KYPHER
          </p>
          <p className="text-xs text-muted mt-2 tracking-wide">🔒 Private — Ester & Kypher only</p>
        </div>

        {resetSent ? (
          <p className="text-sm text-paper/90 text-center">
            Check your email for a link to reset your password.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {mode === 'signup' && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
            />
            {mode !== 'reset' && (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full bg-ink-light border border-ink-border rounded-xl px-4 py-3 text-paper placeholder:text-muted focus:outline-none focus:border-rose"
              />
            )}

            {(localError || error) && (
              <p className="text-sm text-rose">{localError || error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-rose text-white rounded-xl py-3 font-medium hover:bg-rose-dim transition-colors disabled:opacity-50"
            >
              {mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>
          </form>
        )}

        {!resetSent && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 divider-line" />
              <span className="text-xs text-muted">or</span>
              <div className="flex-1 divider-line" />
            </div>

            <button
              onClick={google}
              disabled={busy}
              className="w-full bg-ink-light border border-ink-border text-paper rounded-xl py-3 font-medium hover:bg-ink-border/60 transition-colors flex items-center justify-center gap-2"
            >
              <GoogleIcon /> Continue with Google
            </button>
          </>
        )}

        <div className="text-center mt-6 text-sm text-muted space-x-4">
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); setResetSent(false); }} className="hover:text-paper">
              Back to login
            </button>
          )}
          {mode === 'login' && (
            <>
              <button onClick={() => setMode('signup')} className="hover:text-paper">Create account</button>
              <button onClick={() => setMode('reset')} className="hover:text-paper">Forgot password?</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function humanizeAuthError(message: string) {
  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
    return 'Incorrect email or password.';
  }
  if (message.includes('auth/email-already-in-use')) return 'That email already has an account.';
  if (message.includes('auth/user-not-found')) return 'No account found with that email.';
  if (message.includes('private space')) return message;
  return 'Something went wrong. Please try again.';
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11.3-4.1-13-9.6-.4-1.4-.6-2.9-.6-4.4s.2-3 .6-4.4C12.7 11.1 17.9 7 24 7c3.1 0 5.9 1.1 8.1 3l6-6C34.5 1 29.5-1 24-1 14.6-1 6.5 4.6 2.5 12.5" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.9 1.1 8.1 3l6-6C34.5 5 29.5 3 24 3 15.6 3 8.3 7.8 4.7 14.7Z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 10-1.8 13.7-4.8l-6.3-5.3c-2 1.4-4.6 2.1-7.4 2.1-5.3 0-9.7-2.6-11.5-7.1l-6.5 5C9.5 40.5 16.2 45 24 45Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.3 5.3C41.5 35.6 44 30.2 44 24c0-1.2-.1-2.4-.4-3.5Z" />
    </svg>
  );
}
