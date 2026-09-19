import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();

    // Password reset API will be connected here
    setSubmitted(true);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="court-lines" />

        <h2>Forgot password?</h2>

        <p>
          Enter the email address associated with your HoopBook account.
        </p>

        {submitted ? (
          <div
            className="banner"
            style={{
              marginTop: 20,
              padding: 12,
              borderRadius: 8,
              background: '#e8f5e9',
              color: '#14281E'
            }}
          >
            If an account exists with this email, password reset
            instructions will be sent to you.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
            <div className="field">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              className="btn btn-primary"
              type="submit"
              style={{ marginTop: 8 }}
            >
              Send reset link
            </button>
          </form>
        )}

        <p
          style={{
            marginTop: 20,
            textAlign: 'center',
            fontSize: 13
          }}
        >
          Remember your password?{' '}
          <Link
            to="/login"
            style={{
              color: '#14281E',
              fontWeight: 600
            }}
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}