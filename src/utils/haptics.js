/**
 * Trigger haptic feedback on supported devices.
 * Falls back to a no-op silently on unsupported browsers.
 */
export const haptic = (type = 'light') => {
    if (!('vibrate' in navigator)) return;

    const patterns = {
        light: [10],
        medium: [30],
        heavy: [50],
        success: [10, 50, 20],
        error: [50, 30, 50],
        celebration: [10, 30, 10, 30, 10, 30, 10],
    };

    try {
        navigator.vibrate(patterns[type] || patterns.light);
    } catch (e) {
        // Silently fail — some browsers throw on vibrate
    }
};
