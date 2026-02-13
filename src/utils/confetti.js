/**
 * Lightweight confetti effect using pure CSS animations.
 * No external dependencies.
 */
export const launchConfetti = () => {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden;';
    document.body.appendChild(container);

    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const size = Math.random() * 8 + 4;
        const rotation = Math.random() * 360;
        const duration = Math.random() * 1.5 + 1.5;

        piece.style.cssText = `
            position: absolute;
            left: ${left}%;
            top: -20px;
            width: ${size}px;
            height: ${size * 1.5}px;
            background: ${color};
            border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
            transform: rotate(${rotation}deg);
            animation: confettiFall ${duration}s ease-in ${delay}s forwards;
            opacity: 0.9;
        `;
        container.appendChild(piece);
    }

    // Inject keyframes if not already present
    if (!document.getElementById('confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
            @keyframes confettiFall {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // Clean up after animation
    setTimeout(() => {
        container.remove();
    }, 3500);
};
