import { useState } from 'react';
import paynowLogo from '../assets/paynow.jpg';
import { useParams, Link } from 'react-router-dom';
import Shell from '../components/Shell';
import { useAuth } from '../context/AuthContext';
import { db, getToken } from '../utils/storage';

const API =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function loadRazorpay() {
  return new Promise(resolve => {
    if (window.Razorpay) return resolve(true);

    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';

    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);

    document.body.appendChild(s);
  });
}

export default function Payment() {
  const { requestId } = useParams();
  const { user } = useAuth();

  const request = db
    .allRequests()
    .find(
      r =>
        r.id === requestId &&
        String(r.userId) === String(user.id)
    );

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Selected payment method
  const [paymentMethod, setPaymentMethod] = useState('paynow');

  if (!request) {
    return (
      <Shell title="HoopBook">
        <div className="card">
          <p>Booking not found.</p>

          <Link
            to="/my-bookings"
            className="btn btn-secondary"
            style={{ marginTop: 10 }}
          >
            Back to bookings
          </Link>
        </div>
      </Shell>
    );
  }

  if (request.status !== 'approved') {
    return (
      <Shell title="HoopBook">
        <div className="card">
          <p>
            This booking isn't approved for payment yet.
          </p>

          <Link
            to="/my-bookings"
            className="btn btn-secondary"
            style={{ marginTop: 10 }}
          >
            Back to bookings
          </Link>
        </div>
      </Shell>
    );
  }

  const court = db
    .courts()
    .find(c => c.id === request.courtId);

  const slot = db.slot(request.slotId);

  const fee = Number(request.fee || 25);

  async function pay() {
    setError('');
    setBusy(true);

    try {
      const r = await fetch(`${API}/payments/order`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },

        body: JSON.stringify({
          requestId
        })
      });

      const order = await r.json();

      if (!r.ok) {
        throw new Error(
          order.error || 'Unable to create payment order.'
        );
      }

      const loaded = await loadRazorpay();

      if (!loaded) {
        throw new Error(
          'Razorpay Checkout could not load. Check your internet connection.'
        );
      }

      const rz = new window.Razorpay({
        key: order.keyId,

        amount: Math.round(fee * 100),

        currency: 'SGD',

        name: 'HoopBook',

        description: `${
          court?.name || 'Basketball booking'
        } · ${slot?.date || ''}`,

        order_id: order.orderId,

        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },

        theme: {
          color: '#14281E'
        },

        handler: async response => {
          try {
            const vr = await fetch(
              `${API}/payments/verify`,
              {
                method: 'POST',

                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${getToken()}`
                },

                body: JSON.stringify({
                  ...response,
                  requestId
                })
              }
            );

            const data = await vr.json();

            if (!vr.ok) {
              throw new Error(
                data.error || 'Payment verification failed.'
              );
            }

            await db.hydrate();

            setDone(true);
          } catch (e) {
            setError(e.message);
          }
        }
      });

      rz.on('payment.failed', () => {
        setError(
          'Payment failed or was cancelled. Please try again.'
        );
      });

      rz.open();

    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Shell
        title="HoopBook"
        subtitle="Payment successful"
      >
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '35px 20px'
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              margin: '0 auto 15px',
              borderRadius: '50%',
              background: '#e8f5eb',
              color: '#16743a',
              display: 'grid',
              placeItems: 'center',
              fontSize: 34,
              fontWeight: 700
            }}
          >
            ✓
          </div>

          <h3>Payment confirmed</h3>

          <p>
            Your booking has been successfully paid.
          </p>

          <p className="muted">
            A confirmation email has been sent to{' '}
            <strong>{user.email}</strong>.
          </p>

          <Link
            to="/my-bookings"
            className="btn btn-secondary"
            style={{ marginTop: 15 }}
          >
            Back to bookings
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      title="HoopBook"
      subtitle="Secure payment"
    >

      {/* BOOKING DETAILS */}

      <div className="card">

        <strong>
          {court?.name || 'Basketball Court'}
        </strong>

        <p style={{ marginTop: 6 }}>
          {slot?.date} · {slot?.time} ·{' '}
          {request.playerLabel}
        </p>

        <div className="divider" />

        <div className="row">

          <span className="muted">
            Amount
          </span>

          <strong>
            SGD {fee.toFixed(2)}
          </strong>

        </div>

      </div>


      {/* PAYMENT */}

      <div className="card">

        <h4>
          Choose payment method
        </h4>

        <p
          style={{
            marginTop: 6,
            lineHeight: 1.5
          }}
        >
          Select how you would like to pay
          securely with Razorpay.
        </p>


        {/* PAYMENT OPTIONS */}

        <div className="payment-methods">

          {/* PAYNOW */}
          <button
            type="button"
            className={`payment-method-btn ${
              paymentMethod === 'paynow' ? 'active' : ''
            }`}
            onClick={() => setPaymentMethod('paynow')}
          >
            <img
              src={paynowLogo}
              alt="PayNow"
              className="payment-icon paynow-logo"
            />
          
            <span>
              <strong>PayNow</strong>
              <small>QR payment</small>
            </span>
          </button>
          


          {/* CARD */}

          <button
            type="button"
            className={`payment-method-btn ${
              paymentMethod === 'card'
                ? 'active'
                : ''
            }`}
            onClick={() => {
              setPaymentMethod('card');
              setError('');
            }}
          >
            <span className="payment-icon">
              💳
            </span>

            <span>
              <strong>Card</strong>
              <small>Credit / Debit</small>
            </span>
          </button>


          {/* APPLE PAY */}

          <button
            type="button"
            className={`payment-method-btn ${
              paymentMethod === 'applepay'
                ? 'active'
                : ''
            }`}
            onClick={() => {
              setPaymentMethod('applepay');
              setError('');
            }}
          >
            <span className="payment-icon apple-icon">
                {'\uF8FF'}
            </span>

            <span>
              <strong>Apple Pay</strong>
              <small>Fast checkout</small>
            </span>
          </button>

        </div>


        {/* PAYNOW INFORMATION */}

        {paymentMethod === 'paynow' && (
          <div className="paynow-section">

            <div className="paynow-info">

              <strong>
                PayNow
              </strong>

              <span>
                Scan the QR code using your
                banking app.
              </span>

            </div>

            <div className="paynow-qr">

              <div className="qr-placeholder">

                <div className="qr-pattern">
                  <span />
                  <span />
                  <span />
                </div>

              </div>

            </div>

            <div className="paynow-amount">

              <span>
                Amount
              </span>

              <strong>
                SGD {fee.toFixed(2)}
              </strong>

            </div>

          </div>
        )}


        {/* CARD INFORMATION */}

        {paymentMethod === 'card' && (
          <div className="selected-method-info">

            <div className="selected-method-icon">
              💳
            </div>

            <div>
              <strong>
                Card payment
              </strong>

              <p>
                Click the payment button below
                to securely enter your card
                details in Razorpay Checkout.
              </p>
            </div>

          </div>
        )}


        {/* APPLE PAY INFORMATION */}

        {paymentMethod === 'applepay' && (
          <div className="selected-method-info">

            <div className="selected-method-icon">
              
            </div>

            <div>
              <strong>
                Apple Pay
              </strong>

              <p>
                Click the payment button below
                to continue with Apple Pay if
                it is supported on your device
                and browser.
              </p>
            </div>

          </div>
        )}


        {/* ERROR */}

        {error && (
          <div
            className="banner banner-error"
            style={{ marginTop: 15 }}
          >
            ⚠️ {error}
          </div>
        )}


        {/* PAY BUTTON */}

        <button
          className="btn btn-primary pay-button"
          onClick={pay}
          disabled={busy}
          style={{
            width: '100%',
            marginTop: 15
          }}
        >

          {busy
            ? 'Opening secure checkout…'
            : `Pay SGD ${fee.toFixed(2)}`}

        </button>


        {/* SECURITY */}

        <p
          className="hint"
          style={{
            marginTop: 12,
            lineHeight: 1.5
          }}
        >
          🔒 Payment is securely processed
          and verified server-side using
          Razorpay.
        </p>

      </div>

    </Shell>
  );
}