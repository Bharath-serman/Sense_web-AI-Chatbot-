import React, { useState } from 'react';
import './App.css';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        setTimeout(() => {
          setLoading(false);
          onLogin();
        }, 3000); 
      } else {
        setError(data.message);
        setLoading(false);
      }
    } catch (error) {
      setError('Error logging in');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div>Loading...</div>
        </div>
      ) : (
        <>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>
        </>
      )}
      <div className="signup-link">
        <p>Don't have an account? <a href="/signup">Sign up here</a></p>
      </div>
    </div>
  );
}

export default Login;
