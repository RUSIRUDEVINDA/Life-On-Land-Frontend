import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext } from './toastContext';

const TOAST_ACCENTS = {
    success: {
        icon: CheckCircle2,
        cardClass: 'border-emerald-200/80 bg-[linear-gradient(135deg,rgba(248,250,249,0.98),rgba(232,245,233,0.98))] text-primary-dark shadow-[0_22px_45px_-24px_rgba(22,101,52,0.55)]',
        iconClass: 'bg-emerald-100 text-emerald-700',
        barClass: 'bg-[linear-gradient(90deg,#2a5a45,#8fb8a2)]',
    },
    error: {
        icon: AlertTriangle,
        cardClass: 'border-rose-200/90 bg-[linear-gradient(135deg,rgba(255,247,247,0.98),rgba(255,228,230,0.98))] text-primary-dark shadow-[0_22px_45px_-24px_rgba(190,24,93,0.45)]',
        iconClass: 'bg-rose-100 text-rose-700',
        barClass: 'bg-[linear-gradient(90deg,#be123c,#fb7185)]',
    },
    info: {
        icon: Info,
        cardClass: 'border-sky-200/90 bg-[linear-gradient(135deg,rgba(247,252,255,0.98),rgba(232,244,253,0.98))] text-primary-dark shadow-[0_22px_45px_-24px_rgba(37,99,235,0.4)]',
        iconClass: 'bg-sky-100 text-sky-700',
        barClass: 'bg-[linear-gradient(90deg,#2f5f8f,#8fb8a2)]',
    },
};

const DEFAULT_TITLES = {
    success: 'Done',
    error: 'Something went wrong',
    info: 'Notice',
};

const DEFAULT_DURATION = {
    success: 3600,
    error: 5000,
    info: 4200,
};

const normalizeToastInput = (type, input, fallbackOptions = {}) => {
    if (typeof input === 'string') {
        return {
            type,
            title: fallbackOptions.title || DEFAULT_TITLES[type],
            message: input,
            duration: fallbackOptions.duration,
        };
    }

    return {
        type,
        title: input?.title || DEFAULT_TITLES[type],
        message: input?.message || '',
        duration: input?.duration,
    };
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timeoutsRef = useRef(new Map());
    const nextIdRef = useRef(0);

    const dismiss = useCallback((id) => {
        const timeoutId = timeoutsRef.current.get(id);
        if (timeoutId) {
            window.clearTimeout(timeoutId);
            timeoutsRef.current.delete(id);
        }
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const show = useCallback((input) => {
        const type = input?.type || 'info';
        const id = nextIdRef.current += 1;
        const duration = input?.duration ?? DEFAULT_DURATION[type] ?? DEFAULT_DURATION.info;
        const toast = {
            id,
            type,
            title: input?.title || DEFAULT_TITLES[type],
            message: input?.message || '',
            duration,
        };

        setToasts((prev) => [...prev, toast].slice(-4));

        if (duration > 0) {
            const timeoutId = window.setTimeout(() => {
                dismiss(id);
            }, duration);
            timeoutsRef.current.set(id, timeoutId);
        }

        return id;
    }, [dismiss]);

    const success = useCallback((input, options = {}) => {
        return show(normalizeToastInput('success', input, options));
    }, [show]);

    const error = useCallback((input, options = {}) => {
        return show(normalizeToastInput('error', input, options));
    }, [show]);

    const info = useCallback((input, options = {}) => {
        return show(normalizeToastInput('info', input, options));
    }, [show]);

    useEffect(() => {
        const timeoutMap = timeoutsRef.current;
        return () => {
            timeoutMap.forEach((timeoutId) => window.clearTimeout(timeoutId));
            timeoutMap.clear();
        };
    }, []);

    const value = useMemo(
        () => ({ show, success, error, info, dismiss }),
        [dismiss, error, info, show, success]
    );

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[1200] flex w-[min(92vw,390px)] flex-col gap-3">
                {toasts.map((toast) => {
                    const accent = TOAST_ACCENTS[toast.type] || TOAST_ACCENTS.info;
                    const Icon = accent.icon;

                    return (
                        <div
                            key={toast.id}
                            className={`toast-card pointer-events-auto relative overflow-hidden rounded-[24px] border px-4 py-4 backdrop-blur-xl ${accent.cardClass}`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accent.iconClass}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-bold tracking-tight">{toast.title}</p>
                                    <p className="mt-1 text-[12px] leading-5 text-primary-dark/75">
                                        {toast.message}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => dismiss(toast.id)}
                                    className="rounded-xl p-1.5 text-primary-dark/45 transition hover:bg-white/60 hover:text-primary-dark"
                                    aria-label="Dismiss notification"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
                                <div
                                    className={`toast-progress h-full rounded-full ${accent.barClass}`}
                                    style={{ animationDuration: `${toast.duration}ms` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
