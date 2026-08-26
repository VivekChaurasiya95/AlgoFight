import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export function useAntiCheat(isActive = true) {
    const { notify } = useNotification();
    const [isBlurred, setIsBlurred] = useState(false);
    const [violations, setViolations] = useState(0);

    const handleVisibilityChange = useCallback(() => {
        if (!isActive) return;
        
        if (document.hidden) {
            setIsBlurred(true);
            setViolations(v => v + 1);
            notify({
                type: 'error',
                title: 'Anti-Cheat Warning',
                message: 'You left the battle screen! Multiple violations will result in disqualification.',
                duration: 5000
            });
        } else {
            setIsBlurred(false);
        }
    }, [isActive, notify]);

    const handleBlur = useCallback(() => {
        if (!isActive) return;
        setIsBlurred(true);
    }, [isActive]);

    const handleFocus = useCallback(() => {
        if (!isActive) return;
        setIsBlurred(false);
    }, [isActive]);

    const handleKeyDown = useCallback((e) => {
        if (!isActive) return;
        
        // Prevent PrintScreen
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            navigator.clipboard.writeText(''); // Attempt to clear clipboard
            setViolations(v => v + 1);
            notify({
                type: 'error',
                title: 'Anti-Cheat Warning',
                message: 'Screenshots are disabled during live battles.',
                duration: 5000
            });
        }
    }, [isActive, notify]);

    const handleCopy = useCallback((e) => {
        if (!isActive) return;
        e.preventDefault();
        notify({
            type: 'warning',
            title: 'Anti-Cheat',
            message: 'Copying code is disabled in Live Battle.',
            duration: 3000
        });
    }, [isActive, notify]);

    useEffect(() => {
        if (!isActive) return;

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('copy', handleCopy);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('copy', handleCopy);
        };
    }, [isActive, handleVisibilityChange, handleBlur, handleFocus, handleKeyDown, handleCopy]);

    return {
        isBlurred,
        violations
    };
}
