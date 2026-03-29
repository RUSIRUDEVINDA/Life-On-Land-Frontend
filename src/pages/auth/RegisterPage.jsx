import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDefaultDashboardPathByRole } from '../../utils/auth';

const DEFAULT_API_URL = 'http://localhost:5001';
const getApiBaseUrl = () => {
    if (import.meta.env.DEV) {
        // In dev, route through Vite proxy to avoid CORS issues.
        return '';
    }

    return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/$/, '');
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Passwords don't match");
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
                }),
            });

            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(payload?.message || payload?.error || `Registration failed (${response.status})`);
            }

            // Backend register endpoint sets auth cookie; token may not be returned in body.
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
            setError(requestError.message || 'Failed to register');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-bg-soft overflow-hidden">
            <div className="relative z-10 w-full max-w-[460px] p-12 bg-white rounded-[24px] shadow-[0_20px_40px_rgba(23,54,43,0.08)] border border-primary-medium/20">
                <div className="text-center mb-9">
                    <h2 className="text-[32px] font-bold text-primary-dark mb-3 tracking-tighter">Create Account</h2>
                    <p className="text-text-gray text-[15px]">Join EcoTrack and make an impact</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-semibold text-primary">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            className="px-5 py-4 bg-bg-soft border border-border-light rounded-xl text-[15px] transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/20 outline-none"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="phone" className="text-sm font-semibold text-primary">Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            className="px-5 py-4 bg-bg-soft border border-border-light rounded-xl text-[15px] transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/20 outline-none"
                            placeholder="0771234567 or +94771234567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-sm font-semibold text-primary">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="px-5 py-4 bg-bg-soft border border-border-light rounded-xl text-[15px] transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/20 outline-none"
                            placeholder="hello@ecotrack.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-sm font-semibold text-primary">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="px-5 py-4 bg-bg-soft border border-border-light rounded-xl text-[15px] transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/20 outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="confirmPassword" className="text-sm font-semibold text-primary">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="px-5 py-4 bg-bg-soft border border-border-light rounded-xl text-[15px] transition-all duration-300 focus:bg-white focus:border-primary-medium focus:ring-4 focus:ring-primary-medium/20 outline-none"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="mt-4 p-4 bg-primary text-white rounded-xl text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(42,90,69,0.2)] hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(42,90,69,0.3)] active:translate-y-0">
                        {submitting ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a]">
                        {error}
                    </div>
                )}

                <div className="mt-8 text-center text-[15px] text-text-gray">
                    <p>Already have an account? <Link to="/login" className="text-primary font-semibold transition-colors duration-200 hover:text-primary-medium">Sign in</Link></p>
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute rounded-full w-[400px] h-[400px] bg-primary-medium opacity-25 -top-[150px] -right-[100px] blur-[60px]"></div>
                <div className="absolute rounded-full w-[500px] h-[500px] bg-primary-light opacity-30 -bottom-[200px] -left-[150px] blur-[80px]"></div>
                <div className="absolute rounded-full w-[250px] h-[250px] bg-primary-dark opacity-[0.08] bottom-[30%] right-[20%] blur-[40px]"></div>
            </div>
        </div>
    );
};

export default RegisterPage;
