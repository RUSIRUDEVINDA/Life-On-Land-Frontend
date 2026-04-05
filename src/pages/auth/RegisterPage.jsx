import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDefaultDashboardPathByRole } from '../../utils/auth';
import {
    mapBackendFieldErrors,
    validateRegisterFields,
} from '../../utils/authFormValidation';

const DEFAULT_API_URL = 'http://localhost:5001';
const getApiBaseUrl = () => {
    if (import.meta.env.DEV) {
        return '';
    }

    return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/$/, '');
};

const inputClass = (hasError) =>
    `px-5 py-4 bg-bg-soft border rounded-xl text-[15px] transition-all duration-300 focus:bg-white focus:ring-4 outline-none ${
        hasError
            ? 'border-[#E63946]/55 ring-1 ring-[#E63946]/20 focus:border-[#E63946] focus:ring-[#E63946]/25'
            : 'border-border-light focus:border-primary-medium focus:ring-primary-medium/20'
    }`;

const selectClass = (hasError) =>
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

const RegisterPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('RANGER');
    const [submitting, setSubmitting] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState('');

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
        setFieldErrors({});

        const clientErrors = validateRegisterFields({
            name,
            phone,
            email,
            password,
            confirmPassword,
        });
        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim(),
                    password,
                    role,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                const mapped = mapBackendFieldErrors(payload);
                if (Object.keys(mapped).length > 0) {
                    setFieldErrors(mapped);
                    setFormError('');
                    return;
                }
                setFormError(
                    payload?.message ||
                        payload?.error ||
                        (typeof payload?.error === 'string' ? payload.error : '') ||
                        `Registration failed (${response.status})`
                );
                return;
            }

            if (payload?._id || payload?.data?._id) {
                localStorage.setItem(
                    'user',
                    JSON.stringify({
                        _id: payload._id || payload?.data?._id,
                        name: payload.name || payload?.data?.name || name.trim(),
                        email: payload.email || payload?.data?.email || email.trim(),
                        phone: payload.phone || payload?.data?.phone || phone.trim(),
                        role: payload.role || payload?.data?.role || 'RANGER',
                    })
                );
            }

            navigate(getDefaultDashboardPathByRole(payload?.role || payload?.data?.role || 'RANGER'));
        } catch (requestError) {
            setFormError(requestError.message || 'Failed to register');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-bg-soft overflow-hidden">
            <div className="relative z-10 w-full max-w-115 p-12 bg-white rounded-3xl shadow-[0_20px_40px_rgba(23,54,43,0.08)] border border-primary-medium/20">
                <div className="text-center mb-9">
                    <h2 className="text-[32px] font-bold text-primary-dark mb-3 tracking-tighter">Create Account</h2>
                    <p className="text-text-gray text-[15px]">Join EcoTrack and make an impact</p>
                </div>

                <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-semibold text-primary">
                            Full Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            autoComplete="name"
                            className={inputClass(Boolean(fieldErrors.name))}
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                clearField('name');
                            }}
                            aria-invalid={Boolean(fieldErrors.name)}
                            aria-describedby={fieldErrors.name ? 'register-name-error' : undefined}
                        />
                        <FieldError id="register-name-error" message={fieldErrors.name} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="phone" className="text-sm font-semibold text-primary">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            autoComplete="tel"
                            className={inputClass(Boolean(fieldErrors.phone))}
                            placeholder="0771234567 or +94771234567"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                clearField('phone');
                            }}
                            aria-invalid={Boolean(fieldErrors.phone)}
                            aria-describedby={fieldErrors.phone ? 'register-phone-error' : undefined}
                        />
                        <FieldError id="register-phone-error" message={fieldErrors.phone} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-sm font-semibold text-primary">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            autoComplete="email"
                            className={inputClass(Boolean(fieldErrors.email))}
                            placeholder="hello@ecotrack.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                clearField('email');
                            }}
                            aria-invalid={Boolean(fieldErrors.email)}
                            aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
                        />
                        <FieldError id="register-email-error" message={fieldErrors.email} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="role" className="text-sm font-semibold text-primary">
                            Role
                        </label>
                        <select
                            id="role"
                            className={selectClass(Boolean(fieldErrors.role))}
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                clearField('role');
                            }}
                            aria-invalid={Boolean(fieldErrors.role)}
                            aria-describedby={fieldErrors.role ? 'register-role-error' : undefined}
                        >
                            <option value="RANGER">Ranger</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                        <FieldError id="register-role-error" message={fieldErrors.role} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-sm font-semibold text-primary">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            className={inputClass(Boolean(fieldErrors.password))}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                clearField('password');
                                clearField('confirmPassword');
                            }}
                            aria-invalid={Boolean(fieldErrors.password)}
                            aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
                        />
                        <FieldError id="register-password-error" message={fieldErrors.password} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-primary">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            className={inputClass(Boolean(fieldErrors.confirmPassword))}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                clearField('confirmPassword');
                                clearField('password');
                            }}
                            aria-invalid={Boolean(fieldErrors.confirmPassword)}
                            aria-describedby={
                                fieldErrors.confirmPassword ? 'register-confirm-password-error' : undefined
                            }
                        />
                        <FieldError id="register-confirm-password-error" message={fieldErrors.confirmPassword} />
                    </div>

                    <button
                        type="submit"
                        className="mt-4 p-4 bg-primary text-white rounded-xl text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(42,90,69,0.2)] hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(42,90,69,0.3)] active:translate-y-0"
                    >
                        {submitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                {formError ? (
                    <div className="mt-4 rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a]">
                        {formError}
                    </div>
                ) : null}

                <div className="mt-8 text-center text-[15px] text-text-gray">
                    <p>
                        Already have an account?{' '}
                        <Link
                            to="/login"
                            className="text-primary font-semibold transition-colors duration-200 hover:text-primary-medium"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute rounded-full w-100 h-100 bg-primary-medium opacity-25 -top-37.5 -right-25 blur-[60px]"></div>
                <div className="absolute rounded-full w-125 h-125 bg-primary-light opacity-30 -bottom-50 -left-37.5 blur-[80px]"></div>
                <div className="absolute rounded-full w-62.5 h-62.5 bg-primary-dark opacity-[0.08] bottom-[30%] right-[20%] blur-2xl"></div>
            </div>
        </div>
    );
};

export default RegisterPage;
