import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-shapes">
        <span className="shape circle" />
        <span className="shape triangle" />
        <span className="shape square" />
      </div>
      <div className="error-card">
        <div className="error-icon">🚫</div>
        <h1>404</h1>
        <p>Sorry, the page you are looking for cannot be found.</p>
        <p className="error-subtitle">It may have been moved, renamed, or never existed.</p>
        <Link to="/dashboard" className="btn btn-primary btn-lg">
          Go back home
        </Link>
      </div>
    </div>
  );
}
