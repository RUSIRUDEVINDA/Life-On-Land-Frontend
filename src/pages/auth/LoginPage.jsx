import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const DEFAULT_API_URL = 'http://localhost:5001';
const getApiBaseUrl = () => {
    if (import.meta.env.DEV) {
        // In dev, route through Vite proxy to avoid CORS issues.
        return '';
    }

    return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim().replace(/\/$/, '');
};

const extractToken = (payload) => {
    // Look for JWT in common response structures
    return (
        payload?.token ||
        payload?.accessToken ||
        payload?.data?.token ||
        payload?.data?.accessToken ||
        payload?.user?.token ||
        payload?.metadata?.token ||
        payload?.body?.token ||
        ''
    );
};

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Redirect if already logged in
    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token || user) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            const payload = await response.json().catch(() => ({}));
            console.log('Login API Response payload:', payload); // Debug log

            if (!response.ok) {
                throw new Error(payload?.message || payload?.error || `Login failed (${response.status})`);
            }

            const token = extractToken(payload);
            const userData = payload?.user || payload?.data?.user || (payload?._id ? payload : payload?.data) || null;
            console.log('Extracted user data:', userData);

            if (token || (userData && (userData._id || userData.id || userData.email))) {
                if (token) {
                    localStorage.setItem('token', token);
                }

                if (userData) {
                    localStorage.setItem('user', JSON.stringify(userData));
                }

                navigate('/dashboard');
            } else {
                console.error('No token or user data found in successful login response.');
                setError('Login succeeded but session data was missing. Please contact support.');
            }
        } catch (requestError) {
            console.error('Login error:', requestError);
            setError(requestError.message || 'Failed to login');
        } finally {
            setSubmitting(false);
        }
    };



    return (
        <div className="relative min-h-screen flex items-center justify-center bg-bg-soft overflow-hidden">
            <div className="relative z-10 w-full max-w-115 p-12 bg-white rounded-3xl shadow-[0_20px_40px_rgba(23,54,43,0.08)] border border-primary-medium/20">
                <div className="text-center mb-9">
                    <h2 className="text-[32px] font-bold text-primary-dark mb-3 tracking-tighter">Welcome Back</h2>
                    <p className="text-text-gray text-[15px]">Sign in to continue to EcoTrack</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

                    <button type="submit" className="mt-4 p-4 bg-primary text-white rounded-xl text-base font-semibold transition-all duration-200 shadow-[0_4px_12px_rgba(42,90,69,0.2)] hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(42,90,69,0.3)] active:translate-y-0">
                        {submitting ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 rounded-xl border border-[#E63946]/30 bg-[#fff5f5] px-4 py-3 text-[13px] text-[#a4161a]">
                        {error}
                    </div>
                )}

                <div className="mt-8 text-center text-[15px] text-text-gray">
                    <p>Don't have an account? <Link to="/register" className="text-primary font-semibold transition-colors duration-200 hover:text-primary-medium">Sign up</Link></p>
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

export default LoginPage;
