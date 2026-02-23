import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: number;
    message: string;
    type: ToastType;
}

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
}

interface ConfirmState extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

interface FeedbackContextValue {
    notify: (message: string, type?: ToastType, durationMs?: number) => void;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastItem[]>([]);
    const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

    const notify = useCallback((message: string, type: ToastType = 'info', durationMs = 3000) => {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        setToasts((prev) => [...prev, { id, message, type }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, durationMs);
    }, []);

    const confirm = useCallback((options: ConfirmOptions) => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({
                ...options,
                resolve,
            });
        });
    }, []);

    const closeConfirm = useCallback((result: boolean) => {
        setConfirmState((prev) => {
            if (prev) prev.resolve(result);
            return null;
        });
    }, []);

    useEffect(() => {
        if (!confirmState) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeConfirm(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [confirmState, closeConfirm]);

    const contextValue = useMemo<FeedbackContextValue>(
        () => ({
            notify,
            confirm,
        }),
        [notify, confirm]
    );

    return (
        <FeedbackContext.Provider value={contextValue}>
            {children}

            <div className="fixed top-4 right-4 z-[90] space-y-2 w-[min(90vw,24rem)]">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`rounded-lg px-4 py-3 shadow-lg text-sm font-medium border ${
                            toast.type === 'success'
                                ? 'bg-green-50 text-green-800 border-green-200'
                                : toast.type === 'error'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                        role="status"
                        aria-live="polite"
                    >
                        {toast.message}
                    </div>
                ))}
            </div>

            {confirmState && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[95] p-4">
                    <div
                        className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="global-confirm-title"
                    >
                        <h3 id="global-confirm-title" className="text-xl font-bold text-gray-900 mb-2">
                            {confirmState.title || 'Confirm action'}
                        </h3>
                        <p className="text-gray-700 mb-6">{confirmState.message}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => closeConfirm(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded transition"
                            >
                                {confirmState.cancelLabel || 'Cancel'}
                            </button>
                            <button
                                onClick={() => closeConfirm(true)}
                                className={`flex-1 text-white font-bold py-2 px-4 rounded transition ${
                                    confirmState.destructive
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-yellow-600 hover:bg-yellow-700'
                                }`}
                            >
                                {confirmState.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
};

export const useFeedback = (): FeedbackContextValue => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
};
