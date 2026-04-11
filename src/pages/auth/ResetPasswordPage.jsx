import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getApiOrigin } from '../../utils/apiBaseUrl';
import { mapBackendFieldErrors, validateResetPasswordFields } from '../../utils/authFormValidation';

const inputClass = (hasError) =>
    `px-5 py-4 bg-bg-soft border rounded-xl text-[15px] transition-all duration-300 focus:bg-white focus:ring-4 outline-none ${
        hasError
            ? 'border-[#E63946]/55 ring-1 ring-[#E63946]/20 focus:border-[#E63946] focus:ring-[#E63946]/25'
            : 'border-border-light focus:border-primary-medium focus:ring-primary-medium/20'
    }`;

const FieldError = ({ id, message }) =>
    message ? (
        <p id={id} className="mt-1 text-[12px] font-medium text-[#a4161a]" role="alert">
            {message}
        </p>
    ) : null;

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [fieldErrors, setFieldErrors] = React.useState({});
    const [formError, setFormError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    const clearField = (key) => {
        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccess('');
        setFieldErrors({});

        const clientErrors = validateResetPasswordFields({ token, password, confirmPassword });
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${getApiOrigin()}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ token, password }),
            });

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                const mapped = mapBackendFieldErrors(payload);
                const { _form, ...rest } = mapped;
                if (_form) {
                    setFormError(_form);
                }
                if (Object.keys(rest).length > 0) {
                    setFieldErrors(rest);
                }
                if (_form || Object.keys(rest).length > 0) {
                    return;
                }
                setFormError(payload?.message || payload?.error || `Reset failed (${response.status})`);
                return;
            }

            setSuccess(payload?.message || 'Password updated. You can now sign in with your new password.');
            setTimeout(() => navigate('/login'), 1200);
        } catch (requestError) {
            setFormError(requestError.message || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-bg-soft overflow-hidden">
            <div className="relative z-10 w-full max-w-115 p-12 bg-white rounded-3xl shadow-[0_20px_40px_rgba(23,54,43,0.08)] border border-primary-medium/20">
                <div className="text-center mb-9">
                    <h2 className="text-[32px] font-bold text-primary-dark mb-3 tracking-tighter">Reset password</h2>
                    <p className="text-text-gray text-[15px]">Choose a new password for your account.</p>
                </div>

                {!token ? (
                    <div className="rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a]">
                        Reset token is missing. Please open the link from your email again.
                        <div className="mt-2">
                            <Link
                                to="/forgot-password"
                                className="text-primary font-semibold transition-colors duration-200 hover:text-primary-medium"
                            >
                                Request a new link
                            </Link>
                        </div>
                    </div>
                ) : null}

                <form noValidate onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-sm font-semibold text-primary">
                            New password
                        </label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            className={inputClass(Boolean(fieldErrors.password))}
                            placeholder="Enter a strong password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                clearField('password');
                            }}
                            aria-invalid={Boolean(fieldErrors.password)}
                            aria-describedby={fieldErrors.password ? 'reset-password-error' : undefined}
                        />
                        <FieldError id="reset-password-error" message={fieldErrors.password} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-primary">
                            Confirm password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            className={inputClass(Boolean(fieldErrors.confirmPassword))}
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                clearField('confirmPassword');
                            }}
                            aria-invalid={Boolean(fieldErrors.confirmPassword)}
                            aria-describedby={fieldErrors.confirmPassword ? 'reset-confirm-error' : undefined}
                        />
                        <FieldError id="reset-confirm-error" message={fieldErrors.confirmPassword} />
                    </div>

                    <button
                        type="submit"
                        className="mt-2 p-4 bg-primary text-white rounded-xl text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(42,90,69,0.2)] hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(42,90,69,0.3)] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                        disabled={submitting || !token || Boolean(success)}
                    >
                        {submitting ? 'Updating...' : 'Update password'}
                    </button>
                </form>

                {formError ? (
                    <div className="mt-4 rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a]">
                        {formError}
                    </div>
                ) : null}

                {success ? (
                    <div className="mt-4 rounded-xl border border-primary-medium/30 bg-[#f3fbf6] px-4 py-3 text-[13px] text-primary-dark">
                        <div>{success}</div>
                        <div className="mt-2">
                            <Link
                                to="/login"
                                className="text-primary font-semibold transition-colors duration-200 hover:text-primary-medium"
                            >
                                Go to sign in
                            </Link>
                        </div>
                    </div>
                ) : null}

                <div className="mt-8 text-center text-[15px] text-text-gray">
                    <Link to="/login" className="text-primary font-semibold transition-colors duration-200 hover:text-primary-medium">
                        Back to sign in
                    </Link>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute rounded-full w-100 h-100 bg-primary-medium opacity-25 -top-37.5 -right-25 blur-[60px]"></div>
                <div className="absolute rounded-full w-125 h-125 bg-primary-light opacity-30 -bottom-50 -left-37.5 blur-[80px]"></div>
                <div className="absolute rounded-full w-62.5 h-62.5 bg-primary-dark opacity-[0.08] bottom-[30%] right-[20%] blur-2xl"></div>
            </div>
        </div>
    );
}
