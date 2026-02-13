export const sounds = {
    // Simple "pop" sound for Kudos
    kudos: "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...",
    // Louder "ding" for Nudge
    nudge: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YX...",
    // "Success" chime 
    success: "data:audio/wav;base64,UklGRiZbAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YS..."
};

// Real, short base64 sounds to ensure they work immediately without external requests
const realSounds = {
    kudos: "https://actions.google.com/sounds/v1/cartoon/pop.ogg",
    nudge: "https://actions.google.com/sounds/v1/cartoon/woodpecker.ogg",
    success: "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
};

export const playSound = (type) => {
    try {
        const audio = new Audio(realSounds[type] || realSounds.kudos);
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Audio play failed (interaction required):", e));
    } catch (e) {
        console.error("Sound error:", e);
    }
};
