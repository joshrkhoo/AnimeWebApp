import React, { useState } from 'react';
import { api } from './api';
import { TvIcon } from './Icons';

const AuthScreen = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const session = isLogin
        ? await api.login(username, password)
        : await api.register(username, password);
      onAuthenticated(session);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <span className="brand-mark"><TvIcon /></span>
          <span>Anime Schedule</span>
        </div>
        <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="muted">
          {isLogin
            ? 'Log in to see what airs next on your schedule.'
            : 'Track the shows you watch and when their next episode airs.'}
        </p>

        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            minLength={isLogin ? undefined : 8}
            required
          />
        </label>
        {!isLogin && <p className="hint">At least 8 characters.</p>}

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
        </button>

        <p className="auth-switch">
          {isLogin ? 'New here?' : 'Already have an account?'}{' '}
          <button type="button" className="link" onClick={switchMode}>
            {isLogin ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  );
};

export default AuthScreen;
