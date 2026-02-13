/**
 * Achievement definitions and checking logic.
 * Each achievement has an id, name, description, icon, and a check function.
 */

export const ACHIEVEMENTS = [
    {
        id: 'first_habit',
        name: 'Primer Paso',
        description: 'Creaste tu primer hábito',
        icon: '🌱',
        check: (stats) => stats.totalHabits >= 1,
    },
    {
        id: 'five_habits',
        name: 'Arquitecto',
        description: 'Tienes 5 hábitos activos',
        icon: '🏗️',
        check: (stats) => stats.totalHabits >= 5,
    },
    {
        id: 'streak_3',
        name: 'Constancia',
        description: 'Racha de 3 días seguidos',
        icon: '🔥',
        check: (stats) => stats.bestStreak >= 3,
    },
    {
        id: 'streak_7',
        name: 'Semana Imparable',
        description: 'Racha de 7 días seguidos',
        icon: '⭐',
        check: (stats) => stats.bestStreak >= 7,
    },
    {
        id: 'streak_21',
        name: 'Hábito Instalado',
        description: '21 días — el hábito es parte de ti',
        icon: '🧬',
        check: (stats) => stats.bestStreak >= 21,
    },
    {
        id: 'streak_42',
        name: 'Maestría Total',
        description: '42 días — dominio absoluto',
        icon: '👑',
        check: (stats) => stats.bestStreak >= 42,
    },
    {
        id: 'perfect_week',
        name: 'Semana Perfecta',
        description: '7 días perfectos (todo verde)',
        icon: '💎',
        check: (stats) => stats.bestPerfectStreak >= 7,
    },
    {
        id: 'points_100',
        name: 'Centurión',
        description: 'Acumulaste 100 puntos',
        icon: '💪',
        check: (stats) => stats.totalPoints >= 100,
    },
    {
        id: 'points_500',
        name: 'Élite',
        description: 'Acumulaste 500 puntos',
        icon: '🚀',
        check: (stats) => stats.totalPoints >= 500,
    },
    {
        id: 'points_1000',
        name: 'Leyenda',
        description: 'Acumulaste 1000 puntos',
        icon: '🏆',
        check: (stats) => stats.totalPoints >= 1000,
    },
    {
        id: 'first_kudos',
        name: 'Buen Compañero',
        description: 'Enviaste tus primeros Kudos',
        icon: '💗',
        check: (stats) => stats.kudosSent >= 1,
    },
    {
        id: 'store_buy',
        name: 'Primer Canje',
        description: 'Canjeaste tu primera recompensa',
        icon: '🎁',
        check: (stats) => stats.storeRedemptions >= 1,
    },
];

/**
 * Given user stats, returns { unlocked: [...], locked: [...] }
 */
export const checkAchievements = (stats) => {
    const unlocked = [];
    const locked = [];

    for (const achievement of ACHIEVEMENTS) {
        if (achievement.check(stats)) {
            unlocked.push(achievement);
        } else {
            locked.push(achievement);
        }
    }

    return { unlocked, locked };
};
