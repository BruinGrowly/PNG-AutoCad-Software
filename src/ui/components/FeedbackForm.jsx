/**
 * Feedback Form Component
 * Allows users to send feedback, bug reports, and feature requests
 * Uses mailto: to open user's default email client
 * 
 * PRIVACY: No data is stored on any server. All data is sent directly
 * via the user's own email client.
 */

import React, { useState, useEffect } from 'react';
import './FeedbackForm.css';

const SUPPORT_EMAIL = 'bruinnecessities@gmail.com';

const REPORT_TYPES = [
    { id: 'bug', label: '🐛 Bug Report', subject: '[Bug Report]' },
    { id: 'feedback', label: '💬 General Feedback', subject: '[Feedback]' },
    { id: 'feature', label: '💡 Feature Request', subject: '[Feature Request]' },
    { id: 'question', label: '❓ Question', subject: '[Question]' },
];

// Session error log used for optional bug-report context.
const errorLog = [];
const MAX_ERRORS = 20;

function pushErrorEntry(entry) {
    errorLog.push({
        timestamp: new Date().toISOString(),
        ...entry,
    });
    if (errorLog.length > MAX_ERRORS) errorLog.shift();
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

    // Load recent errors when form opens (only for bug reports)
    useEffect(() => {
        if (reportType === 'bug') {
            setRecentErrors([...errorLog]);
        }
    }, [reportType]);

    // Gather system info (only if user consents)
    const getSystemInfo = () => {
        if (!includeSystemInfo) return '';

        return `
---
SYSTEM INFORMATION (included with your consent):
- App Version: ${appVersion}
- Browser: ${navigator.userAgent}
- Platform: ${navigator.platform}
- Language: ${navigator.language}
- Screen: ${window.screen.width}x${window.screen.height}
- Time: ${new Date().toISOString()}
- Online: ${navigator.onLine}
---`;
    };

    // Format error log for email
    const getErrorLog = () => {
        if (!includeErrorLog || recentErrors.length === 0) return '';

        const errorText = recentErrors.map(e =>
            `[${e.timestamp}] [${e.type.toUpperCase()}] ${e.message}`
        ).join('\n');

        return `
---
ERROR LOG (included with your consent):
${errorText}
---`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormError('');

        if (!hasConsent || !hasPrivacyConsent) {
            setFormError('Please provide all required consents to send this report.');
            return;
        }

        if (!title.trim()) {
            setFormError('Please provide a title for your report.');
            return;
        }

        // Build email body
        const selectedType = REPORT_TYPES.find(t => t.id === reportType);
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

        body += `\n\n---
DATA CONSENT: User has consented to:
- Sending this report via email: YES
- Including system information: ${includeSystemInfo ? 'YES' : 'NO'}
- Including error logs: ${includeErrorLog ? 'YES' : 'NO'}
- Privacy policy acknowledgment: YES

Sent from PNG Civil CAD Feedback System v${appVersion}`;

        // Create mailto link
        const mailtoLink = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Open in user's default email client
        window.location.href = mailtoLink;

        // Show success message
        setShowSuccess(true);
        setTimeout(() => {
            onClose();
        }, 3000);
    };

    // Privacy Policy Modal
    if (showPrivacyPolicy) {
        return (
            <div className="feedback-overlay" onClick={() => setShowPrivacyPolicy(false)}>
                <div className="feedback-modal privacy-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="feedback-header">
                        <h2>🔒 Privacy Notice</h2>
                        <button className="close-btn" onClick={() => setShowPrivacyPolicy(false)}>✕</button>
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
                            <h4>How Your Data is Used</h4>
                            <ul>
                                <li>✅ To respond to your feedback, question, or bug report</li>
                                <li>✅ To improve PNG Civil CAD based on your input</li>
                                <li>✅ To diagnose and fix bugs you report</li>
                            </ul>
                        </section>

                        <section>
                            <h4>How Your Data is NOT Used</h4>
                            <ul>
                                <li>❌ We do NOT store your data on any server</li>
                                <li>❌ We do NOT share your email with third parties</li>
                                <li>❌ We do NOT use your data for marketing</li>
                                <li>❌ We do NOT track you or create profiles</li>
                            </ul>
                        </section>

                        <section>
                            <h4>Data Transmission</h4>
                            <p>This form uses your device's default email application to send feedback.
                                No data is transmitted through our servers. The email goes directly from your
                                email client to our inbox.</p>
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
                            <button className="btn-submit" onClick={() => setShowPrivacyPolicy(false)}>
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
                <div className="feedback-modal success" onClick={(e) => e.stopPropagation()}>
                    <div className="success-icon">✉️</div>
                    <h2>Email Client Opened!</h2>
                    <p>Your default email app should now be open with the report ready to send.</p>
                    <p className="success-note">Please review the email content before sending.</p>
                    <p className="success-note">If it didn't open, you can email us directly at:</p>
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="email-link">{SUPPORT_EMAIL}</a>
                </div>
            </div>
        );
    }

    return (
        <div className="feedback-overlay" onClick={onClose}>
            <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
                <div className="feedback-header">
                    <h2>📝 Send Feedback</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSubmit} className="feedback-form">
                    {formError && (
                        <div className="feedback-error" role="alert">
                            {formError}
                        </div>
                    )}

                    {/* Report Type */}
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

                    {/* Title */}
                    <div className="form-group">
                        <label htmlFor="title">Title *</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={reportType === 'bug'
                                ? 'e.g., Line tool not drawing correctly'
                                : 'Brief summary of your feedback'}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label htmlFor="description">Description *</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={reportType === 'bug'
                                ? 'What happened? What did you expect to happen?'
                                : 'Tell us more...'}
                            rows={4}
                            required
                        />
                    </div>

                    {/* Steps to Reproduce (for bugs) */}
                    {reportType === 'bug' && (
                        <div className="form-group">
                            <label htmlFor="steps">Steps to Reproduce (optional)</label>
                            <textarea
                                id="steps"
                                value={steps}
                                onChange={(e) => setSteps(e.target.value)}
                                placeholder="1. Click on Line tool&#10;2. Click on canvas&#10;3. ..."
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Data Collection Options */}
                    <div className="data-options">
                        <h4>Optional Data to Include</h4>

                        {/* System Info Consent */}
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={includeSystemInfo}
                                    onChange={(e) => setIncludeSystemInfo(e.target.checked)}
                                />
                                <span>Include system information</span>
                            </label>
                            <span className="checkbox-help">
                                Browser type, screen size, app version - helps us reproduce issues
                            </span>
                        </div>

                        {/* Error Log (for bugs only) */}
                        {reportType === 'bug' && (
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={includeErrorLog}
                                        onChange={(e) => setIncludeErrorLog(e.target.checked)}
                                    />
                                    <span>Include recent error logs ({recentErrors.length} entries)</span>
                                </label>
                                <span className="checkbox-help">
                                    Application errors captured during this session - very helpful for debugging
                                </span>
                                {includeErrorLog && recentErrors.length > 0 && (
                                    <div className="error-preview">
                                        <strong>Preview:</strong>
                                        {recentErrors.slice(-3).map((e, i) => (
                                            <div key={i} className="error-item">
                                                [{e.type}] {e.message.substring(0, 100)}...
                                            </div>
                                        ))}
                                        {recentErrors.length > 3 && (
                                            <div className="error-more">...and {recentErrors.length - 3} more</div>
                                        )}
                                    </div>
                                )}
                                {recentErrors.length === 0 && (
                                    <span className="checkbox-help success">✓ No errors logged - great!</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Required Consents */}
                    <div className="consent-section">
                        <h4>Required Consents</h4>

                        {/* Email Consent */}
                        <div className="form-group checkbox-group consent-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={hasConsent}
                                    onChange={(e) => setHasConsent(e.target.checked)}
                                    required
                                />
                                <span>I consent to sending this report via email *</span>
                            </label>
                            <span className="checkbox-help">
                                This will open your default email app. Your email address will be visible to us.
                            </span>
                        </div>

                        {/* Privacy Policy Consent */}
                        <div className="form-group checkbox-group consent-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={hasPrivacyConsent}
                                    onChange={(e) => setHasPrivacyConsent(e.target.checked)}
                                    required
                                />
                                <span>I have read and accept the <button type="button" className="link-btn" onClick={() => setShowPrivacyPolicy(true)}>Privacy Notice</button> *</span>
                            </label>
                        </div>
                    </div>

                    {/* Privacy Summary Box */}
                    <div className="privacy-summary">
                        <div className="privacy-icon">🔒</div>
                        <div className="privacy-text">
                            <strong>Your Privacy is Protected</strong>
                            <ul>
                                <li>📧 Data goes directly via YOUR email client</li>
                                <li>🚫 We do NOT store any data on servers</li>
                                <li>🚫 We do NOT share your email with anyone</li>
                                <li>👀 You can review the email before sending</li>
                            </ul>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={!hasConsent || !hasPrivacyConsent}
                        >
                            Open Email to Send
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
