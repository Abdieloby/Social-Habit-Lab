import React, { useState, useEffect } from 'react';
import {
  Flame, Users, Store, Settings, MessageCircle, TrendingUp,
  Bell, Zap, CheckCircle2, AlertCircle, Heart,
  Plus, Trash2, X, ShieldAlert, Gavel, Sparkles, MoreHorizontal, Edit,
  Edit3, AlertTriangle, Globe, Info, LogOut, DollarSign, PenTool
} from 'lucide-react';
import { auth, db } from './firebase';
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, collection, onSnapshot, addDoc, query, orderBy, limit, serverTimestamp, increment, deleteDoc
} from 'firebase/firestore';

// --- SOCIAL HABIT LAB v4 (FIREBASE EDITION) ---

const App = () => {
  // --- 1. GESTIÓN DE ESTADO ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('my_protocol'); // 'my_protocol' | 'library'
  const [showHabitCreator, setShowHabitCreator] = useState(false);
  const [showPointsLegend, setShowPointsLegend] = useState(false);
  const [showStoreCreator, setShowStoreCreator] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // AUTH & USER STATE
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(null);
  const [usersMap, setUsersMap] = useState({}); // Cache user data for feed avatars

  // PROFILE INSPECTOR STATE
  const [viewingProfile, setViewingProfile] = useState(null);
  const [viewingProfileHabits, setViewingProfileHabits] = useState([]);

  // DATA COLLECTIONS
  const [habits, setHabits] = useState([]);
  const [globalHabits, setGlobalHabits] = useState([]); // Global Library
  const [squad, setSquad] = useState([]);
  const [feed, setFeed] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [selectedStoreIcon, setSelectedStoreIcon] = useState('🎁');

  // INIT AUTH
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      if (!u) {
        setUser(null);
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  // INIT PROFILE
  useEffect(() => {
    if (!authUser) return;
    const userRef = doc(db, 'users', authUser.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUser({ uid: authUser.uid, ...docSnap.data() });
      }
      setLoading(false);
    });
    return unsub;
  }, [authUser]);

  // DATA SUBSCRIPTIONS
  useEffect(() => {
    if (!user) return;

    // 1. My Habits
    const habitRef = collection(db, 'users', user.uid, 'habits');
    const unsubHabits = onSnapshot(query(habitRef, orderBy('createdAt', 'desc')), (snapshot) => {
      setHabits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Squad (Users)
    const usersRef = collection(db, 'users');
    const unsubSquad = onSnapshot(query(usersRef, orderBy('points', 'desc')), (snapshot) => {
      const squadData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSquad(squadData);
      // Map for Avatar Lookup
      const mapping = {};
      squadData.forEach(u => mapping[u.id] = u);
      setUsersMap(mapping);
    });

    // 3. Feed (Logs)
    const feedRef = collection(db, 'feed');
    const unsubFeed = onSnapshot(query(feedRef, orderBy('timestamp', 'desc'), limit(50)), (snapshot) => {
      setFeed(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 4. Store
    const storeRef = collection(db, 'store');
    const unsubStore = onSnapshot(storeRef, (snapshot) => {
      setStoreItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 5. Global Habits Library
    const globalHabitsRef = collection(db, 'habits');
    const unsubGlobal = onSnapshot(query(globalHabitsRef, orderBy('createdAt', 'desc')), (snapshot) => {
      setGlobalHabits(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubHabits();
      unsubSquad();
      unsubFeed();
      unsubStore();
      unsubGlobal();
    };
  }, [user?.uid]);

  // PROFILE INSPECTOR EFFECT
  useEffect(() => {
    if (!viewingProfile) return;
    const q = query(collection(db, 'users', viewingProfile.id, 'habits'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setViewingProfileHabits(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [viewingProfile]);

  // --- 7. EFFECTS & SCHEDULERS ---

  // Request Notification Permission on Mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  // Listen for Real-time Notifications (Nudges / System)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          // Only notify if created recently (avoid spam on reload)
          if (Date.now() - data.timestamp?.toMillis() < 10000) {
            showToast(data.title, data.body, <Bell size={16} />);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(data.title, { body: data.body });
            }
          }
        }
      });
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Notification Scheduler (Local Time Check)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      habits.forEach(h => {
        if (h.notificationTime === currentLabel && !h.notifiedToday) {
          // Basic debounce: assume we haven't notified in this specific minute instance
          showToast(`¡Hora de ${h.name}!`, "No rompas la racha.", <Bell size={16} />);
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`¡Hora de ${h.name}!`, { body: "Es momento de cumplir tu hábito." });
          }
        }
      });
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [habits]);

  // HELPERS UI
  const showToast = (msg, subMsg = null, icon = <Zap size={16} />) => {
    setNotification({ msg, subMsg, icon });
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
      audio.volume = 0.2;
      audio.play().catch(() => { });
    } catch (e) { }
    setTimeout(() => setNotification(null), 4000);
  };

  // --- 2. AUTH ACTIONS ---

  const handleAuth = async (isSignUp, email, password, name, aura) => {
    showToast(isSignUp ? "Registrando..." : "Iniciando sesión...", null, <Zap size={16} className="animate-spin" />);
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          email,
          auraColor: aura,
          points: 0,
          streak: 0,
          role: 'Member',
          createdAt: serverTimestamp()
        });
        showToast("¡Bienvenido, Agente!", "Tu perfil ha sido creado.", <Sparkles size={16} />);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast("Sesión Iniciada", "Cargando tu protocolo...", <CheckCircle2 size={16} />);
      }
    } catch (err) {
      console.error(err);
      let errorMsg = "Ocurrió un error.";
      if (err.code === 'auth/user-not-found') errorMsg = "Usuario no encontrado.";
      if (err.code === 'auth/wrong-password') errorMsg = "Contraseña incorrecta.";
      if (err.code === 'auth/email-already-in-use') errorMsg = "El email ya está en uso.";
      showToast("Error", errorMsg, <AlertCircle size={16} />);
    }
  };

  const handleSignOut = () => {
    signOut(auth);
    showToast("Sesión Cerrada", "Hasta pronto.", <LogOut size={16} />);
  };

  // --- 3. LOGIC ---

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getBasePoints = (status, baseWeight) => {
    if (!status) return 0;
    const pointsMap = {
      1: { green: 10, yellow: 5, red: -4 },
      2: { green: 20, yellow: 8, red: -4 },
      3: { green: 30, yellow: 12, red: -5 }
    };
    return pointsMap[baseWeight][status] || 0;
  };

  const calculateTotalPoints = (status, baseWeight, personalMod) => {
    if (!status) return 0;
    const base = getBasePoints(status, baseWeight);
    return Math.ceil(base * personalMod);
  };

  const handleLog = async (habitId, newStatus) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // History Safe Access
    const history = habit.history || {};
    const oldStatus = history[selectedDate] || null;

    if (oldStatus === newStatus) return;

    const oldPoints = calculateTotalPoints(oldStatus, habit.baseWeight, habit.personalMod);
    const newPoints = calculateTotalPoints(newStatus, habit.baseWeight, habit.personalMod);
    const pointDiff = newPoints - oldPoints;

    const userRef = doc(db, 'users', user.uid);
    const habitRef = doc(db, 'users', user.uid, 'habits', habitId);

    try {
      // Update History Map using dot notation for specific key
      await updateDoc(habitRef, {
        [`history.${selectedDate}`]: newStatus,
        lastUpdated: serverTimestamp()
      });

      // Update Points
      if (pointDiff !== 0) {
        await updateDoc(userRef, { points: increment(pointDiff) });
      }

      // --- STREAK & GRADUATION LOGIC ---
      if (newStatus === 'green') {
        // Calculate new streak for this habit
        let currentStreak = 0;
        const d = new Date(selectedDate);
        // Check backwards
        for (let i = 0; i < 365; i++) {
          const checkDate = new Date(d);
          checkDate.setDate(d.getDate() - i);
          const dateStr = checkDate.toISOString().split('T')[0];

          let s = i === 0 ? newStatus : (history[dateStr] || null); // Use newStatus for today
          if (i === 0 && !s) s = newStatus; // Fallback

          // If we are looking at history map which might not have the new update yet, usage of local var is safer
          if (habit.history && habit.history[dateStr]) s = habit.history[dateStr];
          if (dateStr === selectedDate) s = newStatus;

          if (s === 'green') currentStreak++;
          else break;
        }

        // Graduation Check
        if (currentStreak === 21) {
          showToast('¡GRADUADO! 🎓', `Has completado 21 días de ${habit.name}. ¡Sigue así!`, <Sparkles size={16} />);
          await updateDoc(habitRef, { isGraduated: true });
          await addDoc(collection(db, 'feed'), {
            userId: user.uid,
            user: user.name,
            aura: user.auraColor,
            action: `se GRADUÓ del hábito "${habit.name}" (21 días)`,
            type: 'graduation',
            timestamp: serverTimestamp()
          });
        }

        if (currentStreak === 42) {
          showToast('¡MAESTRÍA! 🏆', `42 Días. Has dominado ${habit.name}.`, <ShieldAlert size={16} />);
          await updateDoc(habitRef, { isMastered: true, archived: true }); // Auto-archive
          await addDoc(collection(db, 'feed'), {
            userId: user.uid,
            user: user.name,
            aura: user.auraColor,
            action: `obtuvo la MAESTRÍA en "${habit.name}" y lo ha completado.`,
            type: 'mastery',
            timestamp: serverTimestamp()
          });
        }
      }

      const statusEmoji = newStatus === 'green' ? '🟢' : newStatus === 'yellow' ? '🟡' : '🔴';

      if (oldStatus) {
        const oldEmoji = oldStatus === 'green' ? '🟢' : oldStatus === 'yellow' ? '🟡' : '🔴';
        showToast(`Corrección (${selectedDate})`, `${oldEmoji} > ${statusEmoji} (${pointDiff > 0 ? '+' : ''}${pointDiff})`, <Edit3 size={16} />);
      } else {
        showToast(`Registrado ${statusEmoji}`, `${newPoints > 0 ? '+' : ''}${newPoints} pts`, <CheckCircle2 size={16} />);

        // Log to Feed only if it's TODAY
        const today = new Date().toISOString().split('T')[0];
        if (selectedDate === today) {
          await addDoc(collection(db, 'feed'), {
            userId: user.uid,
            user: user.name,
            aura: user.auraColor,
            action: `registró ${statusEmoji} en "${habit.name}"`,
            type: 'log',
            timestamp: serverTimestamp(),
            reactions: {},
            isVerified: false,
            isFlagged: false
          });
        }
      }
    } catch (e) {
      console.error(e);
      showToast("Error update", "Revisa tu conexión", <AlertTriangle size={16} />);
    }
  };

  // --- 4. SQUAD ACTIONS ---
  const handleKudos = async (targetMember) => {
    if (user.points >= 5) {
      try {
        const myRef = doc(db, 'users', user.uid);
        const targetRef = doc(db, 'users', targetMember.id);
        await updateDoc(myRef, { points: increment(-5) });
        await updateDoc(targetRef, { points: increment(5) });
        showToast(`Enviado 5pts a ${targetMember.name}`, 'Gran Gesto.', <Heart size={16} />);
      } catch (e) {
        console.error(e);
      }
    } else showToast("Puntos insuficientes", null, <AlertCircle size={16} />);
  };

  const handleNudge = async (targetUser) => {
    try {
      await addDoc(collection(db, 'users', targetUser.id, 'notifications'), {
        title: '¡Te han dado un toque! 🔔',
        body: `${user.name} dice que no olvides tus hábitos.`,
        from: user.uid,
        timestamp: serverTimestamp()
      });
      showToast(`¡Has dado un toque a ${targetUser.name}!`, "Se envió una notificación.", <Bell size={16} />);
    } catch (e) {
      console.error(e);
      showToast("Error al dar toque", null, <AlertCircle size={16} />);
    }
  };

  // --- 5. STORE CRUD ---
  const handleAddStoreItem = async (e) => {
    e.preventDefault();
    const newItem = {
      name: e.target.name.value,
      cost: Number(e.target.cost.value),
      icon: selectedStoreIcon,
      desc: 'Recompensa del Squad',
      category: 'Comunidad',
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'store'), newItem);
    setShowStoreCreator(false);
    showToast("Recompensa Creada", "Disponible en la tienda.", <Store size={16} />);
  };

  const handleEditStoreItem = async (item) => {
    const nName = prompt('Nombre del Premio:', item.name);
    if (!nName) return;
    const nCost = prompt('Costo (puntos):', item.cost);
    if (!nCost) return;
    const nDesc = prompt('Descripción:', item.desc || '');

    await updateDoc(doc(db, 'store', item.id), {
      name: nName,
      cost: Number(nCost),
      desc: nDesc || ''
    });
    showToast('Premio Actualizado', null, <Store size={16} />);
  };

  const handleDeleteStoreItem = async (id, name = "item") => {
    if (!confirm(`¿Eliminar "${name}" de la tienda?`)) return;
    await deleteDoc(doc(db, 'store', id));
    showToast('Premio Eliminado', null, <Trash2 size={16} />);
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      showToast('Error de sesión', 'Por favor, inicia sesión de nuevo.', <AlertCircle size={16} />);
      return;
    }

    if (habits.length >= 3) {
      showToast('Límite Alcanzado', 'Máximo 3 hábitos activos.', <ShieldAlert size={16} />);
      return;
    }

    try {
      const name = e.target.hname.value;
      const baseWeight = Number(e.target.hweight.value);
      const note = e.target.hnote?.value || '';

      if (!name) return;

      // 1. Create in Global Library
      const globalDr = await addDoc(collection(db, 'habits'), {
        name,
        baseWeight,
        note,
        createdBy: user.uid,
        createdAt: serverTimestamp()
      });

      // 2. Auto-Adopt to My Protocol (Default Mod 1.0, No Notif)
      const newPersonalHabit = {
        globalId: globalDr.id,
        name,
        baseWeight,
        personalMod: 1.0,
        status: null,
        note,
        history: {},
        notificationTime: null,
        isFlagged: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'habits'), newPersonalHabit);

      // 3. Log to Feed
      await addDoc(collection(db, 'feed'), {
        userId: user.uid,
        user: user.name,
        aura: user.auraColor,
        action: `creó un nuevo hábito global: "${name}"`,
        type: 'habit_create',
        timestamp: serverTimestamp()
      });

      setShowHabitCreator(false);
      showToast('Hábito Global Creado', 'Añadido a la biblioteca con ajuste 1.0x.', <Globe size={16} />);
    } catch (err) {
      console.error("Error creating habit:", err);
      showToast('Error', 'No se pudo crear. Revisa permisos.', <AlertCircle size={16} />);
    }
  };

  const handleAdoptHabit = async (globalHabit) => {
    const exists = habits.find(h => h.globalId === globalHabit.id);
    if (exists) {
      showToast('Ya tienes este hábito', 'Modifícalo en tu lista.', <Info size={16} />);
      return;
    }

    // Prompt for personal adjustment
    const userMod = prompt(`Define tu Ajuste Personal para "${globalHabit.name}" (Ej. 0.5, 1.0, 1.5):`, "1.0");
    if (userMod === null) return; // Cancelled

    let personalMod = parseFloat(userMod);
    if (isNaN(personalMod) || personalMod <= 0) personalMod = 1.0;

    const newPersonalHabit = {
      globalId: globalHabit.id,
      name: globalHabit.name,
      baseWeight: globalHabit.baseWeight,
      personalMod: personalMod,
      status: null,
      note: globalHabit.note || '',
      isFlagged: false,
      notificationTime: null,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'users', user.uid, 'habits'), newPersonalHabit);
    showToast('Hábito Adoptado', `Añadido con ajuste ${personalMod}x. Configura la alarma en tu tarjeta.`, <CheckCircle2 size={16} />);
  };

  const handleDeleteHabit = async (id) => {
    if (!user?.uid) return;
    if (confirm('¿Archivar este hábito? Si lo completaste hoy, perderás los puntos.')) {
      try {
        const habitRef = doc(db, 'users', user.uid, 'habits', id);
        const habitSnap = await getDoc(habitRef);

        if (habitSnap.exists()) {
          const hData = habitSnap.data();

          // Anti-Cheat: Deduct points if marked today
          let pointsToDeduct = 0;
          if (hData.status && hData.lastUpdated) {
            const updatedDate = hData.lastUpdated.toDate();
            const today = new Date();
            const isToday = updatedDate.getDate() === today.getDate() &&
              updatedDate.getMonth() === today.getMonth() &&
              updatedDate.getFullYear() === today.getFullYear();

            if (isToday) {
              const pointsMap = {
                1: { green: 10, yellow: 5, red: -4 },
                2: { green: 20, yellow: 8, red: -4 },
                3: { green: 30, yellow: 12, red: -5 }
              };
              const base = pointsMap[hData.baseWeight][hData.status] || 0;
              pointsToDeduct = Math.ceil(base * hData.personalMod);
            }
          }

          if (pointsToDeduct !== 0) {
            await updateDoc(doc(db, 'users', user.uid), { points: increment(-pointsToDeduct) });
            await addDoc(collection(db, 'feed'), {
              userId: user.uid,
              user: user.name,
              aura: user.auraColor,
              action: `eliminó "${hData.name}" y perdió ${pointsToDeduct} pts (Corrección Anti-Cheat)`,
              type: 'habit_delete',
              timestamp: serverTimestamp()
            });
            showToast('Corrección Aplicada', `Se dedujeron ${pointsToDeduct} puntos.`, <ShieldAlert size={16} />);
          } else {
            showToast('Hábito Archivado', null, <Trash2 size={16} />);
          }

          await deleteDoc(habitRef);
        }
      } catch (err) {
        console.error(err);
        showToast('Error', 'No se pudo eliminar.', <AlertCircle size={16} />);
      }
    }
  };

  const handleDeleteGlobalHabit = async (globalId, name) => {
    if (confirm(`¿Eliminar "${name}" de la LIBRERÍA GLOBAL? Nadie más podrá adoptarlo.`)) {
      try {
        await deleteDoc(doc(db, 'habits', globalId));
        showToast('Hábito Global Eliminado', 'Ya no aparece en la biblioteca.', <Globe size={16} />);
        await addDoc(collection(db, 'feed'), {
          userId: user.uid,
          user: user.name,
          aura: user.auraColor,
          action: `eliminó "${name}" de la Biblioteca Global`,
          type: 'habit_delete_global',
          timestamp: serverTimestamp()
        });
      } catch (e) {
        showToast('Error', 'No tienes permisos.', <AlertCircle size={16} />);
      }
    }
  };

  const handleEditGlobalHabit = async (gh) => {
    const nName = prompt('Nombre del Hábito Global:', gh.name);
    if (!nName) return;
    const nWeight = prompt('Dificultad Base (1, 2, 3):', gh.baseWeight);
    if (!nWeight) return;
    const nNote = prompt('Nota/Descripción:', gh.note || '');

    await updateDoc(doc(db, 'habits', gh.id), {
      name: nName,
      baseWeight: Number(nWeight),
      note: nNote || ''
    });
    showToast('Biblioteca Actualizada', 'Cambios guardados.', <Globe size={16} />);
  };

  const handleOpenProfile = (targetUser) => {
    setViewingProfile(targetUser);
  };

  // --- 6. SUB-COMPONENTS ---

  const CalendarWidget = ({ habits }) => {
    const [view, setView] = useState('all');

    // Helper: Calculate advanced streaks from a history mapping { 'YYYY-MM-DD': 'status' }
    const calculateStreaks = (historyMap) => {
      const dates = Object.keys(historyMap).sort();
      if (dates.length === 0) return { currentReg: 0, bestReg: 0, currentPerf: 0, bestPerf: 0 };

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      let maxReg = 0, currReg = 0;
      let maxPerf = 0, currPerf = 0;

      let tempReg = 0, tempPerf = 0;

      // Calculate start date (earliest log) to Today
      const start = new Date(dates[0]);
      const end = new Date();

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dStr = d.toISOString().split('T')[0];
        const status = historyMap[dStr];

        if (status === 'green' || status === 'yellow') {
          tempReg++;
        } else {
          if (tempReg > maxReg) maxReg = tempReg;
          tempReg = 0;
        }

        if (status === 'green') {
          tempPerf++;
        } else {
          if (tempPerf > maxPerf) maxPerf = tempPerf;
          tempPerf = 0;
        }
      }

      if (tempReg > maxReg) maxReg = tempReg;
      if (tempPerf > maxPerf) maxPerf = tempPerf;

      // Current Streak Calculation (Backwards from Today)
      const checkBackwards = (requiredStatusFn) => {
        let streak = 0;
        let d = new Date();
        let dStr = d.toISOString().split('T')[0];

        // Should we start from Today or Yesterday?
        if (!requiredStatusFn(historyMap[dStr])) {
          d.setDate(d.getDate() - 1);
          dStr = d.toISOString().split('T')[0];
          if (!requiredStatusFn(historyMap[dStr])) return 0;
        }

        while (true) {
          dStr = d.toISOString().split('T')[0];
          if (requiredStatusFn(historyMap[dStr])) {
            streak++;
            d.setDate(d.getDate() - 1);
          } else {
            break;
          }
        }
        return streak;
      }

      const currentRegCalc = checkBackwards(s => s === 'green' || s === 'yellow');
      const currentPerfCalc = checkBackwards(s => s === 'green');

      return {
        currentReg: currentRegCalc,
        bestReg: maxReg,
        currentPerf: currentPerfCalc,
        bestPerf: maxPerf
      };
    };

    const getGeneralHistory = () => {
      const agg = {};
      habits.forEach(h => {
        if (!h.history) return;
        Object.keys(h.history).forEach(date => {
          if (!agg[date]) agg[date] = [];
          agg[date].push(h.history[date]);
        });
      });

      const finalMap = {};
      Object.keys(agg).forEach(date => {
        const statuses = agg[date];
        if (statuses.includes('red')) finalMap[date] = 'red';
        else if (statuses.every(s => s === 'green') && statuses.length >= habits.length) finalMap[date] = 'green';
        else finalMap[date] = 'yellow';
      });
      return finalMap;
    };

    const targetHistory = view === 'all' ? getGeneralHistory() : habits.find(h => h.id === view)?.history || {};
    const stats = calculateStreaks(targetHistory);
    const daysIdx = [...Array(35).keys()].reverse();
    const today = new Date();

    return (
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <h4 className="font-black text-slate-800 italic text-xl">MIS RACHAS</h4>
          <div className="bg-slate-100 rounded-xl px-3 py-1">
            <select value={view} onChange={(e) => setView(e.target.value)} className="bg-transparent border-none text-xs font-bold text-slate-600 focus:ring-0 cursor-pointer">
              <option value="all">General</option>
              {habits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-evenly mb-8 relative z-10">
          <div className="text-center">
            <div className="text-4xl mb-1">🔥</div>
            <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest mb-1">Días Registrados</div>
            <div className="text-4xl font-black text-slate-800">{stats.currentReg}</div>
            <div className="text-xs font-bold text-slate-400">Racha Actual</div>
            <div className="mt-2 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg inline-block">🏆 Mejor: {stats.bestReg}</div>
          </div>
          <div className="w-px bg-slate-100 h-24"></div>
          <div className="text-center">
            <div className="text-4xl mb-1">🌿</div>
            <div className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mb-1">Días Perfectos</div>
            <div className="text-4xl font-black text-slate-800">{stats.currentPerf}</div>
            <div className="text-xs font-bold text-slate-400">Racha Actual</div>
            <div className="mt-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block">🏆 Mejor: {stats.bestPerf}</div>
          </div>
        </div>

        {/* Heatmap */}
        <div>
          <div className="flex justify-between mb-2 px-1">
            <span className="text-[10px] font-bold text-slate-300">Últimos 35 días</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <div key={i} className="text-center text-[9px] font-black text-slate-300 mb-1">{d}</div>)}
            {daysIdx.map(i => {
              const d = new Date();
              d.setDate(today.getDate() - i);
              const dStr = d.toISOString().split('T')[0];
              const st = targetHistory[dStr];
              const isToday = i === 0;

              let bg = 'bg-slate-50';
              if (st === 'green') bg = 'bg-emerald-400 shadow-md shadow-emerald-200';
              if (st === 'yellow') bg = 'bg-amber-400 shadow-md shadow-amber-200';
              if (st === 'red') bg = 'bg-rose-400';

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full ${bg} transition-all duration-300 flex items-center justify-center text-[9px] font-bold text-white/90 ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  const EmojiSelector = ({ onSelect, selected }) => {
    const emojis = ['⚡', '🔥', '✨', '💎', '🚀', '💪', '🧠', '📚', '🎨', '💸', '🥗', '🏋️', '🧘'];
    return (
      <div className="flex flex-wrap gap-2">
        {emojis.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => onSelect(e)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${selected === e ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            {e}
          </button>
        ))}
      </div>
    );
  };

  const HabitCard = ({ habit, onLog, onDelete }) => {
    // Determine status for the SELECTED DATE
    const currentStatus = habit.history?.[selectedDate] || null;

    const pointsMap = {
      1: { green: 10, yellow: 5, red: -4 },
      2: { green: 20, yellow: 8, red: -4 },
      3: { green: 30, yellow: 12, red: -5 }
    };

    const calculatePoints = (status, weight, mod) => {
      if (!status) return 0;
      return Math.ceil(pointsMap[weight][status] * mod);
    };

    const pGreen = calculatePoints('green', habit.baseWeight, habit.personalMod);
    const pYellow = calculatePoints('yellow', habit.baseWeight, habit.personalMod);
    const pRed = calculatePoints('red', habit.baseWeight, habit.personalMod);

    // Update Habit Personal Mod
    const handleUpdateHabitMod = async (habit) => {
      const current = habit.personalMod || 1;
      const newMod = prompt('Define tu Ajuste Personal (Ej. 0.5, 1.0, 1.5):', current);

      if (newMod !== null) {
        const val = parseFloat(newMod);
        if (!isNaN(val) && val > 0) {
          await updateDoc(doc(db, 'users', user.uid, 'habits', habit.id), {
            personalMod: val
          });
          showToast('Dificultad Ajustada', `Tu multiplicador ahora es ${val}x`, <Zap size={16} />);
        } else {
          showToast('Valor inválido', 'Usa números como 0.5, 1, 1.2', <AlertCircle size={16} />);
        }
      }
    };

    const handleUpdateHabitNotification = async (habit) => {
      const current = habit.notificationTime || '';
      const newTime = prompt('Configurar hora de recordatorio (formato 24h HH:MM) o dejar vacío para desactivar:', current);

      if (newTime !== null) {
        await updateDoc(doc(db, 'users', user.uid, 'habits', habit.id), {
          notificationTime: newTime === '' ? null : newTime
        });
        showToast('Recordatorio Actualizado', newTime ? `Alarma a las ${newTime}` : 'Alarma desactivada', <Bell size={16} />);
      }
    };

    return (
      <div className={`bg-white rounded-3xl p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border transition-all hover:-translate-y-1 relative group ${habit.isFlagged ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-100'}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-lg text-slate-800">{habit.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex flex-col bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase">Base</span>
                <span className="text-xs font-bold text-slate-700">{habit.baseWeight === 1 ? 'Fácil' : habit.baseWeight === 2 ? 'Medio' : 'Difícil'}</span>
              </div>
              <span className="text-slate-300">×</span>
              <button
                onClick={() => handleUpdateHabitMod(habit)}
                className="flex flex-col px-3 py-1 rounded-lg border bg-slate-50 border-slate-100 hover:bg-slate-100 transition-colors text-left"
                title="Clic para editar tu ajuste"
              >
                <span className="text-[9px] font-black uppercase text-slate-400">Ajuste ✎</span>
                <span className="text-xs font-bold text-slate-700">{habit.personalMod}x</span>
              </button>

              {/* Notification Indicator */}
              {habit.notificationTime && (
                <div className="flex flex-col px-3 py-1 rounded-lg border bg-indigo-50 border-indigo-100">
                  <span className="text-[9px] font-black uppercase text-indigo-400">Alarma</span>
                  <span className="text-xs font-bold text-indigo-700">{habit.notificationTime}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateHabitNotification(habit)}
              title="Configurar Recordatorio"
              className={`transition-colors ${habit.notificationTime ? 'text-indigo-500 bg-indigo-50 p-2 rounded-xl' : 'text-slate-300 hover:text-indigo-400'}`}
            >
              <Bell size={20} className={habit.notificationTime ? "fill-current" : ""} />
            </button>
            {habit.globalId && <button title="Hábito Global" className="text-slate-300"><Globe size={20} /></button>}
            <button onClick={() => onDelete(habit.id)} className="text-slate-300 hover:text-rose-400">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[{ s: 'green', v: pGreen, bg: 'bg-emerald-500', i: '🟢' }, { s: 'yellow', v: pYellow, bg: 'bg-amber-400', i: '🟡' }, { s: 'red', v: pRed, bg: 'bg-rose-500', i: '🔴' }].map((opt) => (
            <button
              key={opt.s}
              onClick={() => onLog(habit.id, opt.s)}
              className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${currentStatus === opt.s ? `${opt.bg} text-white shadow-lg scale-[1.02]` : 'bg-slate-50 text-slate-300 hover:bg-white hover:shadow-md'
                }`}
            >
              <span className={`text-xl ${currentStatus !== opt.s && 'grayscale opacity-60'}`}>{opt.i}</span>
              {currentStatus !== opt.s && <span className="text-[9px] font-bold mt-1 opacity-70">{opt.v > 0 ? '+' : ''}{opt.v}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const LoginScreen = ({ handleAuth }) => {
    const [isSignUp, setIsSignUp] = useState(false);

    const handleSubmit = (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const password = e.target.password.value;
      const name = isSignUp ? e.target.username.value : null;
      const aura = isSignUp ? e.target.color.value : null;
      handleAuth(isSignUp, email, password, name, aura);
    };

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic text-slate-900">SOCIAL LAB</h1>
            <p className="text-slate-400 font-medium">Firebase Edition</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-2">Nombre de Agente</label>
                <input name="username" required placeholder="Tu Nombre" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-2">Email</label>
              <input name="email" type="email" required placeholder="correo@ejemplo.com" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase ml-2">Contraseña</label>
              <input name="password" type="password" required placeholder="••••••••" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
            </div>
            {isSignUp && (
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-2">Aura</label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                    <label key={color} className="cursor-pointer">
                      <input type="radio" name="color" value={color} className="peer sr-only" defaultChecked={color === '#6366f1'} />
                      <div className="w-full aspect-square rounded-full bg-slate-100 peer-checked:ring-4 ring-offset-2 ring-indigo-500 transition-all" style={{ backgroundColor: color }}></div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
              {isSignUp ? 'Registrar Agente' : 'Iniciar Sesión'}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-bold text-indigo-500 hover:underline">
                {isSignUp ? '¿Ya tienes cuenta? Ingresa aquí' : '¿Nuevo recluta? Regístrate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // --- RENDER ---

  if (loading) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-bold">
      <Zap size={48} className="text-indigo-500 animate-pulse mb-4" />
      <span className="animate-pulse">Sincronizando con Social Lab...</span>
    </div>;
  }

  if (!user && !authUser) {
    return <LoginScreen handleAuth={handleAuth} />;
  }

  if (!user) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-bold">
      <AlertTriangle size={48} className="text-amber-500 mb-4" />
      <span>Error: Perfil no encontrado.</span>
      <button onClick={handleSignOut} className="mt-4 px-6 py-2 bg-indigo-600 rounded-xl">Reintentar</button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 font-sans select-none overflow-x-hidden pb-32">
      {/* Toast */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-200 w-[90%] max-w-sm">
          <div className="text-amber-400 mt-1">{notification.icon}</div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest">{notification.msg}</div>
            {notification.subMsg && <div className="text-[10px] text-slate-300 font-medium mt-1">{notification.subMsg}</div>}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center bg-white shadow-sm rounded-b-[2.5rem] mb-6 relative z-10">
        <div>
          <h2 className="text-3xl font-black italic text-slate-900 tracking-tighter">HOLA, {user.name.split(' ')[0].toUpperCase()}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-md">Racha {user.streak} días</span>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-wider rounded-md">{user.points} pts</span>
          </div>
        </div>
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ backgroundColor: user.auraColor }}>
            {user.name[0]}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full border-2 border-white">NV.1</div>
        </div>
      </header>

      <main className="px-6 space-y-8">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            {/* View Toggle */}
            <div className="flex p-1 bg-slate-200 rounded-xl mb-4">
              <button onClick={() => setViewMode('my_protocol')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'my_protocol' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Mi Protocolo</button>
              <button onClick={() => setViewMode('reports')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'reports' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Reporte</button>
              <button onClick={() => setViewMode('library')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'library' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>Biblioteca Global</button>
            </div>

            {viewMode === 'my_protocol' && (
              <>
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Protocolo Del</h3>
                    <input
                      type="date"
                      value={selectedDate}
                      max={new Date().toISOString().split('T')[0]} // Cannot log future
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-indigo-600 border-none p-0 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <button onClick={() => setShowPointsLegend(!showPointsLegend)} className="text-slate-300 hover:text-indigo-400"><Info size={16} /></button>
                </div>
                {/* Protocol Habits */}
                {habits.map(habit => (
                  <HabitCard key={habit.id} habit={habit} onLog={handleLog} onDelete={handleDeleteHabit} />
                ))}
                {habits.length === 0 && (
                  <div className="text-center py-12 opacity-50">
                    <p className="font-bold text-slate-400">Sin hábitos activos</p>
                    <p className="text-xs text-slate-300">Ve a la Biblioteca Global para añadir uno.</p>
                  </div>
                )}
              </>
            )}

            {viewMode === 'reports' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CalendarWidget habits={habits} />
              </div>
            )}

            {viewMode === 'library' && (
              <>
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Biblioteca Global</h3>
                </div>
                <button onClick={() => setShowHabitCreator(!showHabitCreator)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 mb-4">
                  <Plus size={20} />
                  <span>Crear Nuevo Hábito Global</span>
                </button>

                <div className="space-y-3">
                  {globalHabits.map(gh => (
                    <div key={gh.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-slate-800">{gh.name}</h4>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">Dif: {gh.baseWeight}</span>
                      </div>
                      <div className="flex gap-2">
                        {user.role === 'Admin' || gh.createdBy === user.uid ? (
                          <>
                            <button onClick={() => handleEditGlobalHabit(gh)} className="p-2 text-slate-200 hover:text-indigo-400"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteGlobalHabit(gh.id, gh.name)} className="p-2 text-slate-200 hover:text-rose-300"><Trash2 size={16} /></button>
                          </>
                        ) : null}
                        <button onClick={() => handleAdoptHabit(gh)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-100">Adoptar</button>
                      </div>
                    </div>
                  ))}
                  {globalHabits.length === 0 && <div className="text-center text-slate-300 italic">Biblioteca vacía.</div>}
                </div>
              </>
            )}

            {/* Creator Modal */}
            {showHabitCreator && (
              <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom-10 duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-black italic text-2xl text-slate-800">NUEVO HÁBITO</h3>
                    <button onClick={() => setShowHabitCreator(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleCreateHabit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase">Nombre del Hábito</label>
                      <input name="hname" required placeholder="Ej. Leer 5 páginas" className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase">Dificultad Base</label>
                      <select name="hweight" className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-800 mt-1">
                        <option value="1">Fácil (1)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-indigo-400 uppercase">Nota (Opcional)</label>
                      <textarea name="hnote" placeholder="Descripción breve..." className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 mt-1 text-xs" rows="2"></textarea>
                    </div>

                    <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Crear Global</button>
                    <p className="text-[10px] text-center text-slate-400 px-4">Se creará en la biblioteca global y se agregará tu lista personal (Ajuste 1.0x).</p>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* SQUAD TAB */}
        {activeTab === 'squad' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="bg-indigo-600 rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden">
              <h2 className="text-2xl font-black italic tracking-tighter relative z-10">CLASIFICACIÓN</h2>
              <p className="text-indigo-200 text-xs relative z-10">Comunidad Activa</p>
            </div>
            {squad.map((member, idx) => (
              <div key={member.id} onClick={() => handleOpenProfile(member)} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="font-black text-slate-200 text-xl w-6">{idx + 1}</div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: member.auraColor }}>{member.name?.[0]}</div>
                  <div>
                    <p className="font-bold text-slate-800">{member.name} {member.id === user.uid && '(Tú)'}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-indigo-500">{member.points} pts</span>
                      {member.streak > 0 && <span className="flex items-center gap-1"><Flame size={10} /> {member.streak}</span>}
                    </div>
                  </div>
                </div>
                {member.id !== user.uid && (
                  <div className="flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleNudge(member); }} className="bg-slate-50 p-3 rounded-2xl text-slate-400 active:scale-95 hover:bg-white"><Bell size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleKudos(member); }} className="bg-pink-50 text-pink-500 p-3 rounded-2xl active:scale-95 hover:bg-pink-100"><Heart size={18} /></button>
                  </div>
                )}
              </div>
            ))}

            {/* Profile Inspector Modal */}
            {viewingProfile && (
              <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewingProfile(null)}>
                <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center">
                    <h3 className="font-black italic text-2xl text-slate-800">EXPEDIENTE</h3>
                    <button onClick={() => setViewingProfile(null)} className="p-2 bg-slate-100 rounded-full"><X size={20} /></button>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-lg" style={{ backgroundColor: viewingProfile.auraColor }}>{viewingProfile.name?.[0]}</div>
                    <div>
                      <h4 className="font-bold text-xl text-slate-900">{viewingProfile.name}</h4>
                      <div className="flex gap-3 text-xs font-bold text-slate-500 mt-1">
                        <span>{viewingProfile.points} pts</span>
                        <span>{viewingProfile.streak} días racha</span>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-2">Protocolo Activo</h5>
                    {viewingProfileHabits.map(h => (
                      <div key={h.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-700">{h.name}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">Dif: {h.baseWeight}</span>
                            <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded font-bold text-indigo-500">Mod: {h.personalMod}x</span>
                          </div>
                        </div>
                        <div className="text-xl">
                          {h.status === 'green' ? '🟢' : h.status === 'yellow' ? '🟡' : h.status === 'red' ? '🔴' : '⚪'}
                        </div>
                      </div>
                    ))}
                    {viewingProfileHabits.length === 0 && <div className="text-center text-slate-400 text-xs italic py-4">Sin hábitos visibles.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEED TAB */}
        {activeTab === 'feed' && (
          <div className="space-y-4 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Actividad Reciente</h3>
            </div>
            {feed.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md" style={{ backgroundColor: item.aura || '#ccc' }}>
                  {item.user?.[0]}
                </div>
                <div>
                  <p className="text-sm text-slate-800 leading-tight"><span className="font-bold">{item.user}</span> {item.action}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Hace un momento</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STORE TAB */}
        {activeTab === 'store' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-b-[3rem] -mx-6 px-8 pt-12 pb-10 text-white shadow-xl mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-20"><Zap size={120} /></div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter relative z-10">La Tiendita</h2>
              <div className="mt-4 bg-white/20 inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md font-black text-sm relative z-10">
                <Zap size={14} className="fill-current" />
                <span>{user.points} Puntos Disponibles</span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setShowStoreCreator(!showStoreCreator)} className="flex-1 py-4 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-3xl text-indigo-500 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                <Plus size={20} /> <span>Agregar Recompensa</span>
              </button>
            </div>

            {showStoreCreator && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const newItem = {
                    name: e.target.name.value,
                    cost: Number(e.target.cost.value),
                    icon: selectedStoreIcon,
                    desc: 'Recompensa del Squad',
                    category: 'Comunidad',
                    createdAt: serverTimestamp()
                  };
                  await addDoc(collection(db, 'store'), newItem);
                  setShowStoreCreator(false);
                  showToast("Recompensa Creada", "Disponible en la tienda.", <Store size={16} />);
                }}
                className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-xl space-y-4 animate-in zoom-in-95 duration-200"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Nueva Recompensa</h3>
                  <button type="button" onClick={() => setShowStoreCreator(false)} className="text-slate-300"><X size={20} /></button>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre del Premio</label>
                  <input name="name" required placeholder="Ej. El DJ Dictador" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-5 gap-3">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Costo (Pts)</label>
                    <input name="cost" type="number" required placeholder="250" className="w-full mt-1 p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Icono</label>
                    <div className="mt-1">
                      <EmojiSelector onSelect={setSelectedStoreIcon} selected={selectedStoreIcon} />
                    </div>
                  </div>
                </div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Publicar Recompensa</button>
              </form>
            )}

            {storeItems.length === 0 && (
              <div className="text-center py-4">
                <button
                  onClick={async () => {
                    if (!confirm('¿Surtir la tienda con los 24 premios predefinidos?')) return;
                    const rewards = [
                      { c: 'Poder y Control', n: 'El DJ Dictador', p: 150, i: '🎵', d: 'Control total de la música por 30 min.' },
                      { c: 'Poder y Control', n: 'Cinéfilo Supremo', p: 500, i: '🍿', d: 'Tú eliges la película sin votación.' },
                      { c: 'Poder y Control', n: 'Bautizo Forzoso', p: 300, i: '🏷️', d: 'Cambias el nombre del grupo por 24h.' },
                      { c: 'Poder y Control', n: 'Veto de Restaurante', p: 200, i: '🚫', d: 'Prohíbes un lugar para la próxima salida.' },
                      { c: 'Poder y Control', n: 'El Planificador', p: 400, i: '🗺️', d: 'Decides el plan completo del sábado.' },

                      { c: 'Social y Ego', n: 'Podcast Personalizado', p: 250, i: '🎙️', d: 'Un amigo te manda nota de voz de 2 min elogiándote.' },
                      { c: 'Social y Ego', n: 'Hype Man por 24h', p: 350, i: '🔥', d: 'Amigo debe elogiar todo lo que subas hoy.' },
                      { c: 'Social y Ego', n: 'La Serenata Vergonzosa', p: 600, i: '🎤', d: 'El Squad te canta una canción.' },
                      { c: 'Social y Ego', n: 'Sticker Pack Hero', p: 150, i: '🖼️', d: 'Admin crea sticker tuyo para el grupo.' },
                      { c: 'Social y Ego', n: 'El Oráculo', p: 100, i: '🔮', d: 'Pregunta incómoda a un miembro (Verdad absoluta).' },
                      { c: 'Social y Ego', n: 'Buenos Días VIP', p: 80, i: '☀️', d: 'Mensaje motivacional personalizado mañana.' },

                      { c: 'Ventajas Juego', n: 'Escudo de Inmunidad', p: 300, i: '🛡️', d: 'Salta un hábito hoy sin perder racha.' },
                      { c: 'Ventajas Juego', n: 'Comodín de la Mentira', p: 400, i: '🎭', d: 'Transforma Rojo a Amarillo (una vez).' },
                      { c: 'Ventajas Juego', n: 'Inmunidad a Nudges', p: 100, i: '🔕', d: 'Bloquea notificaciones de presión por 48h.' },
                      { c: 'Ventajas Juego', n: 'Doble o Nada', p: 200, i: '🎰', d: 'Mañana puntos dobles (ganar o perder).' },

                      { c: 'Caos y Diversión', n: 'Cambio de Look Ajeno', p: 500, i: '🤡', d: 'Eliges foto de perfil de un amigo por 3 días.' },
                      { c: 'Caos y Diversión', n: 'Impuesto de Silencio', p: 150, i: '🤐', d: 'Muteas a un amigo en la vida real por 5 min.' },
                      { c: 'Caos y Diversión', n: 'El Meme Designado', p: 200, i: '🐸', d: 'Apruebas el próximo meme del grupo.' },
                      { c: 'Caos y Diversión', n: 'Traductor Oficial', p: 250, i: '🧐', d: 'Obligas a hablar con acento en la cena.' },

                      { c: 'Vida Real', n: 'Impuesto Helado', p: 1000, i: '🍦', d: 'Squad te invita un helado.' },
                      { c: 'Vida Real', n: 'Chofer Designado', p: 800, i: '🚗', d: 'No manejas en la próxima salida.' },
                      { c: 'Vida Real', n: 'Barista Personal', p: 400, i: '☕', d: 'Alguien te prepara tu bebida favorita.' },
                      { c: 'Vida Real', n: 'El Capricho', p: 2000, i: '🎁', d: 'Regalo fondeado por el grupo.' },
                      { c: 'Vida Real', n: 'Libre de Limpieza', p: 600, i: '🧹', d: 'Exento de limpiar tras la fiesta.' },
                    ];

                    for (const r of rewards) {
                      // Simple duplicate check by name
                      const exists = storeItems.find(i => i.name === r.n);
                      if (!exists) {
                        await addDoc(collection(db, 'store'), {
                          name: r.n, cost: r.p, icon: r.i, desc: r.d, category: r.c, createdAt: serverTimestamp()
                        });
                      }
                    }
                    showToast("Tienda Surtida", "Se agregaron los items faltantes.", <Store size={16} />);
                  }}
                  className="text-slate-400 font-bold text-xs underline hover:text-indigo-500"
                >
                  📦 Surtir Inventario (Admin)
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {storeItems.map(item => (
                <div key={item.id} className="bg-white rounded-[2rem] p-5 flex justify-between items-center border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 bg-slate-50 px-3 py-1 text-[8px] font-black uppercase text-slate-400 rounded-bl-xl border-l border-b border-slate-50">{item.category || 'General'}</div>
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">{item.icon}</div>
                    <div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight max-w-[150px] mt-1">{item.desc || 'Premio exclusivo'}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <Zap size={12} className="text-amber-500 fill-amber-500" />
                        <p className="text-xs font-black text-slate-900">{item.cost} pts</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <button
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black transition-all uppercase tracking-widest ${user.points >= item.cost ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 active:scale-95' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                      onClick={async () => {
                        if (user.points >= item.cost) {
                          await updateDoc(doc(db, 'users', user.uid), { points: increment(-item.cost) });
                          showToast(`Canjeado: ${item.name}`, '¡Disfrútalo!', <Store size={16} />);
                          await addDoc(collection(db, 'feed'), {
                            userId: user.uid, user: user.name, aura: user.auraColor,
                            action: `canjeó su racha por: "${item.name}"`,
                            type: 'store_buy', timestamp: serverTimestamp()
                          });
                        }
                      }}
                    >
                      Canjear
                    </button>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditStoreItem(item)} className="p-2 text-slate-200 hover:text-indigo-400"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteStoreItem(item.id)} className="p-2 text-slate-200 hover:text-rose-400"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 pt-10 text-center">
            <div className="w-32 h-32 mx-auto rounded-full text-5xl flex items-center justify-center text-white font-black shadow-2xl" style={{ backgroundColor: user.auraColor }}>{user.name[0]}</div>
            <h2 className="text-4xl font-black italic text-slate-900">{user.name}</h2>

            <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">Notificaciones 8 PM</span>
                <button className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">Activar</button>
              </div>
              <div className="h-px bg-slate-100"></div>
              <button onClick={handleSignOut} className="w-full py-3 text-rose-500 font-black bg-rose-50 rounded-xl">Cerrar Sesión</button>
            </div>
          </div>
        )}
      </main>

      {/* Nav */}
      <nav className="fixed bottom-8 left-6 right-6 max-w-lg mx-auto h-20 bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-50 flex items-center justify-evenly z-50 px-2">
        {[{ id: 'dashboard', icon: <TrendingUp size={24} /> }, { id: 'feed', icon: <MessageCircle size={24} /> }, { id: 'squad', icon: <Users size={24} /> }, { id: 'store', icon: <Store size={24} /> }, { id: 'profile', icon: <Settings size={24} /> }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-slate-900 text-white -translate-y-6 shadow-xl shadow-slate-900/20 scale-110' : 'text-slate-300 hover:text-indigo-400'}`}>
            {tab.icon}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
