import React from 'react';

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-primary-dark/30 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            ></div>
            <div className="relative bg-white rounded-[20px] shadow-premium w-full max-w-xl max-h-[92vh] overflow-y-auto z-10 animate-in fade-in zoom-in duration-300">
                <div className="p-5">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
