import React, { useState, useEffect } from 'react';
import {
  Flame, Users, Store, Settings, MessageCircle, TrendingUp,
  Bell, Zap, CheckCircle2, AlertCircle, Heart,
  Plus, Trash2, X, ShieldAlert, Gavel, Sparkles, MoreHorizontal,
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
  const [showHabitCreator, setShowHabitCreator] = useState(false);
  const [showPointsLegend, setShowPointsLegend] = useState(false);
  const [showStoreCreator, setShowStoreCreator] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // AUTH & USER STATE
  const [authUser, setAuthUser] = useState(null);
  const [user, setUser] = useState(null);
  const [usersMap, setUsersMap] = useState({}); // Cache user data for feed avatars

  // DATA COLLECTIONS
  const [habits, setHabits] = useState([]);
  const [habitLibrary, setHabitLibrary] = useState([
    { id: 'lib1', name: 'Sin Azúcar', baseWeight: 3 },
    { id: 'lib2', name: 'Gimnasio', baseWeight: 3 },
    { id: 'lib3', name: 'Leer 20 Páginas', baseWeight: 1 },
    { id: 'lib4', name: 'Beber 2L Agua', baseWeight: 1 },
    { id: 'lib5', name: 'Meditar 10min', baseWeight: 2 },
  ]);

  const [squad, setSquad] = useState([]);
  const [feed, setFeed] = useState([]);
  const [storeItems, setStoreItems] = useState([]);

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

    return () => {
      unsubHabits();
      unsubSquad();
      unsubFeed();
      unsubStore();
    };
  }, [user?.uid]);

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
    const oldStatus = habit.status;

    if (oldStatus === newStatus) return;

    const oldPoints = calculateTotalPoints(oldStatus, habit.baseWeight, habit.personalMod);
    const newPoints = calculateTotalPoints(newStatus, habit.baseWeight, habit.personalMod);
    const pointDiff = newPoints - oldPoints;

    // Optimistic UI handled by Firestore listener, but let's do the writes
    const userRef = doc(db, 'users', user.uid);
    const habitRef = doc(db, 'users', user.uid, 'habits', habitId);

    try {
      await updateDoc(habitRef, { status: newStatus, lastUpdated: serverTimestamp() });
      await updateDoc(userRef, { points: increment(pointDiff) });

      const statusEmoji = newStatus === 'green' ? '🟢' : newStatus === 'yellow' ? '🟡' : '🔴';

      if (oldStatus) {
        const oldEmoji = oldStatus === 'green' ? '🟢' : oldStatus === 'yellow' ? '🟡' : '🔴';
        showToast(`Corrección`, `${oldEmoji} > ${statusEmoji} (${pointDiff > 0 ? '+' : ''}${pointDiff})`, <Edit3 size={16} />);
      } else {
        showToast(`Registrado ${statusEmoji}`, `${newPoints > 0 ? '+' : ''}${newPoints} pts`, <CheckCircle2 size={16} />);
        // Add Feed Item
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

  const handleNudge = (name) => {
    // Could be implemented via cloud functions or simple notification collection
    showToast(`¡Has dado un toque a ${name}!`, "Se envió una notificación.", <Bell size={16} />);
  };

  // --- 5. STORE CRUD ---
  const handleAddStoreItem = async (e) => {
    e.preventDefault();
    const newItem = {
      name: e.target.name.value,
      cost: Number(e.target.cost.value),
      icon: e.target.icon.value || '🎁',
      desc: 'Creado por la comunidad',
      createdAt: serverTimestamp()
    };
    await addDoc(collection(db, 'store'), newItem);
    setShowStoreCreator(false);
    showToast("Recompensa Creada", "Disponible en la tienda.", <Store size={16} />);
  };

  const handleDeleteStoreItem = async (id) => {
    if (confirm('¿Borrar?')) {
      await updateDoc(doc(db, 'store', id), { deleted: true }); // Soft delete or deleteDoc
    }
  };

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!user?.uid) {
      showToast('Error de sesión', 'Por favor, inicia sesión de nuevo.', <AlertCircle size={16} />);
      return;
    }

    try {
      const name = e.target.hname.value;
      const baseWeight = Number(e.target.hweight.value);
      const personalMod = Number(e.target.hmod.value);

      if (!name) return;

      const newHabit = {
        name,
        baseWeight,
        personalMod,
        status: null,
        note: '',
        isFlagged: false,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'habits'), newHabit);
      setShowHabitCreator(false);
      showToast('Protocolo Iniciado', 'Añadido a tu lista 🚀', <Plus size={16} />);
    } catch (err) {
      console.error("Error creating habit:", err);
      showToast('Error de Firebase', 'Asegúrate de que las reglas de Firestore estén en modo prueba.', <AlertCircle size={16} />);
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!user?.uid) return;
    if (confirm('¿Quieres archivar este hábito definitivamente?')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'habits', id));
        showToast('Hábito Archivado', null, <Trash2 size={16} />);
      } catch (err) {
        showToast('Error', 'No se pudo eliminar.', <AlertCircle size={16} />);
      }
    }
  };

  // --- 6. SUB-COMPONENTS ---

  const HabitCard = ({ habit, onLog, onDelete }) => {
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
              <div className="flex flex-col px-3 py-1 rounded-lg border bg-slate-50 border-slate-100">
                <span className="text-[9px] font-black uppercase text-slate-400">Ajuste</span>
                <span className="text-xs font-bold text-slate-700">{habit.personalMod}x</span>
              </div>
            </div>
          </div>
          <button onClick={() => onDelete(habit.id)} className="text-slate-300 hover:text-rose-400">
            <Trash2 size={20} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[{ s: 'green', v: pGreen, bg: 'bg-emerald-500', i: '🟢' }, { s: 'yellow', v: pYellow, bg: 'bg-amber-400', i: '🟡' }, { s: 'red', v: pRed, bg: 'bg-rose-500', i: '🔴' }].map((opt) => (
            <button
              key={opt.s}
              onClick={() => onLog(habit.id, opt.s)}
              className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${habit.status === opt.s ? `${opt.bg} text-white shadow-lg scale-[1.02]` : 'bg-slate-50 text-slate-300 hover:bg-white hover:shadow-md'
                }`}
            >
              <span className={`text-xl ${habit.status !== opt.s && 'grayscale opacity-60'}`}>{opt.i}</span>
              {habit.status !== opt.s && <span className="text-[9px] font-bold mt-1 opacity-70">{opt.v > 0 ? '+' : ''}{opt.v}</span>}
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
      <header className="px-6 pt-12 pb-4 sticky top-0 bg-[#F8F9FC]/80 backdrop-blur-xl z-40 border-b border-white/50 flex justify-between items-center">
        <div><h1 className="text-2xl font-black italic tracking-tighter text-slate-900">SOCIAL LAB</h1></div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-100 shadow-sm">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: user.auraColor }}>{user.name[0]}</div>
            <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Banco</span><span className="text-sm font-black text-slate-800 leading-none">{user.points}</span></div>
          </div>
          <button onClick={handleSignOut} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-rose-100 hover:text-rose-500"><LogOut size={16} /></button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 max-w-lg mx-auto">

        {activeTab === 'dashboard' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mi Protocolo</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowPointsLegend(!showPointsLegend)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-400"><Info size={16} /></button>
                <button onClick={() => setShowHabitCreator(!showHabitCreator)} className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"><Plus size={16} /> Hábito</button>
              </div>
            </div>

            {showPointsLegend && (
              <div className="bg-slate-900 text-white p-4 rounded-3xl mb-4 animate-in slide-in-from-top-4">
                <p className="text-xs font-medium text-slate-400 mb-2">Sistema de Puntos (Base)</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                  <div className="bg-white/10 p-2 rounded-xl text-emerald-400">🟢 +10/20/30</div>
                  <div className="bg-white/10 p-2 rounded-xl text-amber-400">🟡 +5/8/12</div>
                  <div className="bg-white/10 p-2 rounded-xl text-rose-400">🔴 -4/-5</div>
                </div>
              </div>
            )}

            {showHabitCreator && (
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl mb-4 animate-in slide-in-from-top-4">
                <h4 className="font-bold text-indigo-900 text-sm mb-2">Nuevo Hábito</h4>
                <form onSubmit={handleCreateHabit} className="space-y-3">
                  <input name="hname" required placeholder="Nombre (ej. Leer)" className="w-full p-2 rounded-xl border-none text-sm" />
                  <select name="hweight" className="w-full p-2 rounded-xl text-sm"><option value="1">Fácil Base</option><option value="2">Medio Base</option><option value="3">Difícil Base</option></select>
                  <select name="hmod" className="w-full p-2 rounded-xl text-sm"><option value="1.0">Normal (1.0x)</option><option value="1.5">Difícil (1.5x)</option><option value="0.5">Fácil (0.5x)</option></select>
                  <button className="w-full bg-indigo-600 text-white p-2 rounded-xl font-bold text-sm">Crear</button>
                </form>
              </div>
            )}

            {habits.length === 0 && <div className="text-center p-8 text-slate-300 text-sm italic">No tienes hábitos activos. ¡Crea uno!</div>}
            {habits.map(habit => <HabitCard key={habit.id} habit={habit} onLog={handleLog} onDelete={handleDeleteHabit} />)}
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="bg-indigo-600 rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden">
              <h2 className="text-2xl font-black italic tracking-tighter relative z-10">CLASIFICACIÓN</h2>
              <p className="text-indigo-200 text-xs relative z-10">Comunidad Activa</p>
            </div>
            {squad.map((member, idx) => (
              <div key={member.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100">
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
                    <button onClick={() => handleNudge(member.name)} className="bg-slate-50 p-3 rounded-2xl text-slate-400 active:scale-95"><Bell size={18} /></button>
                    <button onClick={() => handleKudos(member)} className="bg-pink-50 text-pink-500 p-3 rounded-2xl active:scale-95"><Heart size={18} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl mb-6">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Tiendita</h2>
              <div className="mt-4 bg-white/20 inline-block px-4 py-2 rounded-xl backdrop-blur-md font-bold text-sm">Saldo: {user.points} pts</div>
            </div>

            <button onClick={() => setShowStoreCreator(!showStoreCreator)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:bg-slate-50">+ Agregar Recompensa</button>

            {showStoreCreator && (
              <form onSubmit={handleAddStoreItem} className="bg-white p-4 rounded-3xl border border-slate-200 space-y-3">
                <input name="name" required placeholder="Nombre del premio" className="w-full p-2 bg-slate-50 rounded-xl text-sm font-bold" />
                <div className="flex gap-2">
                  <input name="cost" type="number" required placeholder="Costo" className="w-1/2 p-2 bg-slate-50 rounded-xl text-sm font-bold" />
                  <input name="icon" placeholder="Emoji" className="w-1/2 p-2 bg-slate-50 rounded-xl text-sm font-bold" />
                </div>
                <button className="w-full bg-slate-900 text-white py-2 rounded-xl font-bold text-sm">Guardar</button>
              </form>
            )}

            {storeItems.map(item => (
              <div key={item.id} className="bg-white rounded-3xl p-5 flex justify-between items-center border border-slate-100 shadow-sm">
                <div className="flex gap-4 items-center">
                  <div className="text-3xl">{item.icon}</div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.name}</h4>
                    <p className="text-xs text-orange-500 font-black">{item.cost} pts</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteStoreItem(item.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16} /></button>
                  <button
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${user.points >= item.cost ? 'bg-slate-900 text-white active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                    onClick={async () => {
                      if (user.points >= item.cost) {
                        await updateDoc(doc(db, 'users', user.uid), { points: increment(-item.cost) });
                        showToast(`Canjeado: ${item.name}`, '¡Disfrútalo!', <Store size={16} />);
                      }
                    }}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FEED TAB - (Restored previously omitted view) */}
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
