import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Dummy login, navigate straight to dashboard
        navigate('/dashboard');
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-bg-soft overflow-hidden">
            <div className="relative z-10 w-full max-w-[460px] p-12 bg-white rounded-[24px] shadow-[0_20px_40px_rgba(23,54,43,0.08)] border border-primary-medium/20">
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
                        Sign In
                    </button>
                </form>

                <div className="mt-8 text-center text-[15px] text-text-gray">
                    <p>Don't have an account? <Link to="/register" className="text-primary font-semibold transition-colors duration-200 hover:text-primary-medium">Sign up</Link></p>
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

export default LoginPage;
