import React from 'react';
import { Link } from 'react-router-dom';

export default function ServerError() {
  return (
    <div className="error-page">
      <div className="error-shapes">
        <span className="shape circle" />
        <span className="shape diamond" />
        <span className="shape line" />
      </div>
      <div className="error-card error-card-alt">
        <div className="error-icon">⚠️</div>
        <h1>500</h1>
        <p>Oops! Something went wrong on our end.</p>
        <p className="error-subtitle">We are working to fix the issue. Try refreshing or come back later.</p>
        <Link to="/dashboard" className="btn btn-primary btn-lg">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
