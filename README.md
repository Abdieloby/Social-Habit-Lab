# Social Habit Lab v4 (Master Edition) 🚀

A premium gamified habit-tracking application designed for social accountability and high-performance lifestyle design.

![Social Habit Lab Preview](https://github.com/Abdieloby/Social-Habit-Lab/blob/main/public/preview.png?raw=true)

## ✨ Features

- **🏆 Performance Math Engine**: Precise "Traffic Light" logic (Green/Yellow/Red) weighted by difficulty.
- **📈 Personal Modifiers**: Subjective difficulty adjustments (0.5x, 1.0x, 1.5x).
- **🛡️ Squad Accountability**: Real-time mock social feed with Peer Review (Validate/Report).
- **🏪 Token Economy**: Earn points for habits and spend them on custom rewards in the Store.
- **🎨 Premium UX**: Glassmorphism aesthetic, fluid animations, and mobile-first design.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite.
- **Styling**: Tailwind CSS (PostCSS).
- **Icons**: Lucide React.
- **Animations**: Tailwind-animate.

## 🚀 Deployment

This project is ready to be deployed on **Vercel** or **Netlify**.

1. Connect your GitHub repository.
2. Build Command: `npm run build`
3. Output Directory: `dist`

## 🧪 Math Logic

Each habit follows the "Traffic Light" protocol:

| Difficulty | Green (Success) | Yellow (Partial) | Red (Fail) |
| :--- | :---: | :---: | :---: |
| **Easy** | +10 pts | +5 pts | -4 pts |
| **Medium** | +20 pts | +8 pts | -4 pts |
| **Hard** | +30 pts | +12 pts | -5 pts |

**Formula**: `Math.ceil(BasePoints * PersonalModifier)`
