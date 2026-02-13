/**
 * Feedback form modal.
 * Uses mailto: so data is sent via the user's email client.
 */

import React, { useState, useEffect } from 'react';
import './FeedbackForm.css';

const SUPPORT_EMAIL = 'bruinnecessities@gmail.com';

const REPORT_TYPES = [
  { id: 'bug', label: 'Bug Report', subject: '[Bug Report]' },
  { id: 'feedback', label: 'General Feedback', subject: '[Feedback]' },
  { id: 'feature', label: 'Feature Request', subject: '[Feature Request]' },
  { id: 'question', label: 'Question', subject: '[Question]' },
];

const errorLog = [];
const MAX_ERRORS = 20;

function pushErrorEntry(entry) {
  errorLog.push({
    timestamp: new Date().toISOString(),
    ...entry,
  });
  if (errorLog.length > MAX_ERRORS) {
    errorLog.shift();
  }
}

export function FeedbackForm({ onClose, appVersion = '2.0.0' }) {
  const [reportType, setReportType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true);
  const [includeErrorLog, setIncludeErrorLog] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [hasPrivacyConsent, setHasPrivacyConsent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [recentErrors, setRecentErrors] = useState([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const handleWindowError = (event) => {
      pushErrorEntry({
        type: 'unhandled',
        message: `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
      });
    };

    const handleUnhandledRejection = (event) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      pushErrorEntry({
        type: 'promise',
        message: reason,
      });
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (reportType === 'bug') {
      setRecentErrors([...errorLog]);
    }
  }, [reportType]);

  const getSystemInfo = () => {
    if (!includeSystemInfo) return '';

    return `
---
SYSTEM INFORMATION (included with consent):
- App Version: ${appVersion}
- Browser: ${navigator.userAgent}
- Platform: ${navigator.platform}
- Language: ${navigator.language}
- Screen: ${window.screen.width}x${window.screen.height}
- Time: ${new Date().toISOString()}
- Online: ${navigator.onLine}
---`;
  };

  const getErrorLog = () => {
    if (!includeErrorLog || recentErrors.length === 0) return '';

    const errorText = recentErrors.map((entry) => (
      `[${entry.timestamp}] [${entry.type.toUpperCase()}] ${entry.message}`
    )).join('\n');

    return `
---
ERROR LOG (included with consent):
${errorText}
---`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    if (!hasConsent || !hasPrivacyConsent) {
      setFormError('Please provide all required consents to send this report.');
      return;
    }

    if (!title.trim()) {
      setFormError('Please provide a title for your report.');
      return;
    }

    const selectedType = REPORT_TYPES.find((item) => item.id === reportType);
    const subject = `${selectedType.subject} PNG Civil CAD - ${title}`;

    let body = `${description}`;

    if (reportType === 'bug' && steps.trim()) {
      body += `\n\nSTEPS TO REPRODUCE:\n${steps}`;
    }

    if (includeSystemInfo) {
      body += `\n${getSystemInfo()}`;
    }

    if (includeErrorLog && recentErrors.length > 0) {
      body += `\n${getErrorLog()}`;
    }

    body += `

---
DATA CONSENT: User has consented to:
- Sending this report via email: YES
- Including system information: ${includeSystemInfo ? 'YES' : 'NO'}
- Including error logs: ${includeErrorLog ? 'YES' : 'NO'}
- Privacy policy acknowledgment: YES

Sent from PNG Civil CAD Feedback System v${appVersion}`;

    const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (showPrivacyPolicy) {
    return (
      <div className="feedback-overlay" onClick={() => setShowPrivacyPolicy(false)}>
        <div className="feedback-modal privacy-modal" onClick={(event) => event.stopPropagation()}>
          <div className="feedback-header">
            <h2>Privacy Notice</h2>
            <button type="button" className="close-btn" onClick={() => setShowPrivacyPolicy(false)}>Close</button>
          </div>
          <div className="privacy-content">
            <h3>PNG Civil CAD - Feedback Data Privacy Notice</h3>

            <section>
              <h4>What Data We Collect</h4>
              <p>When you submit feedback, you may optionally include:</p>
              <ul>
                <li><strong>System Information:</strong> Browser type, screen size, operating system, app version</li>
                <li><strong>Error Logs:</strong> Recent application error messages (for bug reports)</li>
                <li><strong>Your Email Address:</strong> Visible when you send the email from your client</li>
              </ul>
            </section>

            <section>
              <h4>How Your Data Is Used</h4>
              <ul>
                <li>Used to respond to your feedback, question, or bug report</li>
                <li>Used to improve PNG Civil CAD based on your input</li>
                <li>Used to diagnose and fix bugs you report</li>
              </ul>
            </section>

            <section>
              <h4>How Your Data Is Not Used</h4>
              <ul>
                <li>We do not store your data on any server</li>
                <li>We do not share your email with third parties</li>
                <li>We do not use your data for marketing</li>
                <li>We do not track users or create profiles</li>
              </ul>
            </section>

            <section>
              <h4>Data Transmission</h4>
              <p>
                This form uses your device default email application to send feedback.
                No data is transmitted through our servers. The email goes directly from your client to our inbox.
              </p>
            </section>

            <section>
              <h4>Your Rights</h4>
              <ul>
                <li>You can choose what information to include</li>
                <li>You can review the email before sending</li>
                <li>You can request deletion of any report by emailing us</li>
              </ul>
            </section>

            <section>
              <h4>Contact</h4>
              <p>For privacy concerns, contact: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
            </section>

            <div className="privacy-footer">
              <p><em>Last updated: January 2026</em></p>
              <button type="button" className="btn-submit" onClick={() => setShowPrivacyPolicy(false)}>
                I Understand
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="feedback-overlay" onClick={onClose}>
        <div className="feedback-modal success" onClick={(event) => event.stopPropagation()}>
          <div className="success-icon">Email</div>
          <h2>Email Client Opened</h2>
          <p>Your default email app should now be open with the report draft.</p>
          <p className="success-note">Please review the email content before sending.</p>
          <p className="success-note">If it did not open, email us directly at:</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="email-link">{SUPPORT_EMAIL}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(event) => event.stopPropagation()}>
        <div className="feedback-header">
          <h2>Send Feedback</h2>
          <button type="button" className="close-btn" onClick={onClose}>Close</button>
        </div>

        <form onSubmit={handleSubmit} className="feedback-form">
          {formError && (
            <div className="feedback-error" role="alert">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label>What type of report is this?</label>
            <div className="report-types">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  className={`type-btn ${reportType === type.id ? 'active' : ''}`}
                  onClick={() => setReportType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={reportType === 'bug'
                ? 'Example: line tool not drawing correctly'
                : 'Brief summary of your feedback'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={reportType === 'bug'
                ? 'What happened, and what did you expect to happen?'
                : 'Tell us more...'}
              rows={4}
              required
            />
          </div>

          {reportType === 'bug' && (
            <div className="form-group">
              <label htmlFor="steps">Steps to Reproduce (optional)</label>
              <textarea
                id="steps"
                value={steps}
                onChange={(event) => setSteps(event.target.value)}
                placeholder={'1. Click Line tool\n2. Click canvas\n3. Observe issue'}
                rows={3}
              />
            </div>
          )}

          <div className="data-options">
            <h4>Optional Data to Include</h4>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={includeSystemInfo}
                  onChange={(event) => setIncludeSystemInfo(event.target.checked)}
                />
                <span>Include system information</span>
              </label>
              <span className="checkbox-help">
                Browser type, screen size, and app version help us reproduce issues.
              </span>
            </div>

            {reportType === 'bug' && (
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeErrorLog}
                    onChange={(event) => setIncludeErrorLog(event.target.checked)}
                  />
                  <span>Include recent error logs ({recentErrors.length} entries)</span>
                </label>
                <span className="checkbox-help">
                  Session errors are useful for debugging.
                </span>

                {includeErrorLog && recentErrors.length > 0 && (
                  <div className="error-preview">
                    <strong>Preview:</strong>
                    {recentErrors.slice(-3).map((entry, index) => (
                      <div key={index} className="error-item">
                        [{entry.type}] {entry.message.substring(0, 100)}...
                      </div>
                    ))}
                    {recentErrors.length > 3 && (
                      <div className="error-more">...and {recentErrors.length - 3} more</div>
                    )}
                  </div>
                )}
                {recentErrors.length === 0 && (
                  <span className="checkbox-help success">No session errors logged.</span>
                )}
              </div>
            )}
          </div>

          <div className="consent-section">
            <h4>Required Consents</h4>

            <div className="form-group checkbox-group consent-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasConsent}
                  onChange={(event) => setHasConsent(event.target.checked)}
                  required
                />
                <span>I consent to sending this report via email *</span>
              </label>
              <span className="checkbox-help">
                This opens your default email app. Your email address will be visible to us.
              </span>
            </div>

            <div className="form-group checkbox-group consent-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hasPrivacyConsent}
                  onChange={(event) => setHasPrivacyConsent(event.target.checked)}
                  required
                />
                <span>
                  I have read and accept the{' '}
                  <button type="button" className="link-btn" onClick={() => setShowPrivacyPolicy(true)}>
                    Privacy Notice
                  </button>{' '}
                  *
                </span>
              </label>
            </div>
          </div>

          <div className="privacy-summary">
            <div className="privacy-icon">Data</div>
            <div className="privacy-text">
              <strong>Your Privacy Is Protected</strong>
              <ul>
                <li>Data is sent through your own email client</li>
                <li>No form data is stored on our servers</li>
                <li>Your email is not shared with third parties</li>
                <li>You can review the message before sending</li>
              </ul>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-submit"
              disabled={!hasConsent || !hasPrivacyConsent}
            >
              Open Email Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
