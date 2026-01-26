import React, { useState, useEffect } from 'react';
import {
  Flame, Users, Store, Settings, MessageCircle, TrendingUp,
  Bell, Zap, CheckCircle2, AlertCircle, Heart,
  Plus, Trash2, X, ShieldAlert, Gavel, Sparkles, MoreHorizontal,
  Edit3, AlertTriangle, Globe, Info, LogOut, DollarSign, PenTool
} from 'lucide-react';

// --- SOCIAL HABIT LAB v4 (MAESTRA - ENHANCED) ---

const App = () => {
  // --- 1. GESTIÓN DE ESTADO ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showHabitCreator, setShowHabitCreator] = useState(false);
  const [showPointsLegend, setShowPointsLegend] = useState(false);
  const [showStoreCreator, setShowStoreCreator] = useState(false);
  const [notification, setNotification] = useState(null);

  // LOGIN / AUTH STATE
  const [user, setUser] = useState(null); // Starts null for Login screen
  const [isLoginMode, setIsLoginMode] = useState(true);

  // BIBLIOTECA GLOBAL
  const [habitLibrary, setHabitLibrary] = useState([
    { id: 'lib1', name: 'Sin Azúcar', baseWeight: 3 }, // Difícil
    { id: 'lib2', name: 'Gimnasio', baseWeight: 3 }, // Difícil
    { id: 'lib3', name: 'Leer 20 Páginas', baseWeight: 1 }, // Fácil
    { id: 'lib4', name: 'Beber 2L Agua', baseWeight: 1 }, // Fácil
    { id: 'lib5', name: 'Meditar 10min', baseWeight: 2 }, // Medio
  ]);

  // MIS HÁBITOS
  const [habits, setHabits] = useState([
    { id: 1, libraryId: 'lib1', name: 'Sin Azúcar', baseWeight: 3, personalMod: 1.0, status: null, note: '', isFlagged: false },
    { id: 2, libraryId: 'lib2', name: 'Gimnasio', baseWeight: 3, personalMod: 1.5, status: null, note: '', isFlagged: false },
  ]);

  // SQUAD DATA
  const [squad, setSquad] = useState([
    {
      id: 'u2', name: 'Roxana', auraColor: '#ec4899', points: 1240, streak: 12, status: 'green',
    },
    {
      id: 'u3', name: 'Gabriel', auraColor: '#10b981', points: 915, streak: 3, status: 'yellow',
    }
  ]);

  // FEED DE ACTIVIDAD
  const [feed, setFeed] = useState([
    {
      id: 101, userId: 'u2', user: 'Roxana', action: '¡Racha de 12 días! 🔥',
      time: 'Hace 2h', aura: '#ec4899', type: 'milestone',
      isVerified: true, isFlagged: false, reactions: { '🔥': 4 }
    },
    {
      id: 102, userId: 'u3', user: 'Gabriel', action: 'registró 🟢 en "Gym"',
      time: 'Hace 3h', aura: '#10b981', type: 'log',
      isVerified: false, isFlagged: false, note: "Olvidé el reloj pero corrí 5k", reactions: {}
    }
  ]);

  // TIENDA DATA (Editable)
  const [storeItems, setStoreItems] = useState([
    { id: 'r1', name: 'Elegir Película', cost: 500, icon: '🍿', desc: 'Dictas la película del sábado.' },
    { id: 'r2', name: 'Control DJ', cost: 150, icon: '🎵', desc: 'Controlas la música 30 min.' },
    { id: 'r3', name: 'Inmunidad', cost: 300, icon: '🛡️', desc: 'Saltar un día sin perder racha.' },
    { id: 'r4', name: 'Impuesto Helado', cost: 1000, icon: '🍦', desc: 'El Squad te invita un helado.' }
  ]);

  // HELPERS UI
  const showToast = (msg, subMsg = null, icon = <Zap size={16} />) => {
    setNotification({ msg, subMsg, icon });
    // Simulate Sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
      audio.volume = 0.2;
      audio.play().catch(e => console.log('Audio requires interaction'));
    } catch (e) { }
    setTimeout(() => setNotification(null), 4000);
  };

  // --- 2. AUTH ACTIONS ---

  const handleLogin = (e) => {
    e.preventDefault();
    const name = e.target.username.value;
    if (!name) return;

    // Simulate Login
    setUser({
      id: 'u1',
      name: name,
      auraColor: e.target.color.value || '#6366f1',
      points: 0,
      streak: 0,
      role: 'Member'
    });
  };

  const handleSignOut = () => {
    if (confirm('¿Cerrar sesión?')) {
      setUser(null);
      setActiveTab('dashboard');
    }
  };

  // --- 3. MOTOR LÓGICO DE PUNTOS ---

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

  const handleLog = (id, newStatus) => {
    const habit = habits.find(h => h.id === id);
    const oldStatus = habit.status;

    if (oldStatus === newStatus) return;

    const oldPoints = calculateTotalPoints(oldStatus, habit.baseWeight, habit.personalMod);
    const newPoints = calculateTotalPoints(newStatus, habit.baseWeight, habit.personalMod);
    const pointDiff = newPoints - oldPoints;

    setHabits(habits.map(h => h.id === id ? { ...h, status: newStatus, isFlagged: false } : h));
    setUser(u => ({ ...u, points: u.points + pointDiff }));

    const statusEmoji = newStatus === 'green' ? '🟢' : newStatus === 'yellow' ? '🟡' : '🔴';

    if (oldStatus) {
      const oldEmoji = oldStatus === 'green' ? '🟢' : oldStatus === 'yellow' ? '🟡' : '🔴';
      showToast(`Corrección`, `${oldEmoji} > ${statusEmoji} (${pointDiff > 0 ? '+' : ''}${pointDiff})`, <Edit3 size={16} />);
    } else {
      showToast(`Registrado ${statusEmoji}`, `${newPoints > 0 ? '+' : ''}${newPoints} pts`, <CheckCircle2 size={16} />);
    }

    if (!oldStatus) {
      const newEntry = {
        id: Date.now(), userId: user.id, user: user.name,
        action: `registró ${statusEmoji} en "${habit.name}"`,
        time: 'Justo ahora', aura: user.auraColor, note: habit.note,
        isVerified: false, isFlagged: false, reactions: {}, type: 'log'
      };
      setFeed([newEntry, ...feed]);
    }
  };

  // --- 4. SQUAD ACTIONS ---

  const handleKudos = (targetMember) => {
    if (user.points >= 5) {
      // Deduct from me
      setUser(u => ({ ...u, points: u.points - 5 }));
      // Add to them (Update Squad State)
      setSquad(prev => prev.map(m => m.id === targetMember.id ? { ...m, points: m.points + 5 } : m));

      showToast(`Enviado 5pts a ${targetMember.name}`, 'Tu generosidad es legendaria.', <Heart size={16} />);
    } else showToast("Puntos insuficientes", "Necesitas 5 pts para dar Kudos.", <AlertCircle size={16} />);
  };

  const handleNudge = (name) => {
    showToast(`¡Has dado un toque a ${name}!`, "Se envió una notificación.", <Bell size={16} />);
  };

  const handleRequestNotification = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification("Social Lab Activado", { body: "Recibirás recordatorios a las 8:00 PM." });
          showToast("Notificaciones Activas", "Te avisaremos a las 8 PM.", <Bell size={16} />);
        }
      });
    } else {
      showToast("No soportado", "Tu navegador no soporta notificaciones web.", <AlertCircle size={16} />);
    }
  };

  // --- 5. STORE CRUD ---

  const handleAddStoreItem = (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const cost = Number(e.target.cost.value);
    const icon = e.target.icon.value || '🎁';

    const newItem = { id: `cx-${Date.now()}`, name, cost, icon, desc: 'Recompensa personalizada' };
    setStoreItems([...storeItems, newItem]);
    setShowStoreCreator(false);
    showToast("Recompensa Creada", "Disponible en la tienda.", <Store size={16} />);
  };

  const handleDeleteStoreItem = (id) => {
    if (confirm('¿Borrar esta recompensa?')) {
      setStoreItems(prev => prev.filter(i => i.id !== id));
      showToast("Eliminado", null, <Trash2 size={16} />);
    }
  };

  // --- 6. SUB-COMPONENTS ---

  const HabitCard = ({ habit }) => {
    const pGreen = calculateTotalPoints('green', habit.baseWeight, habit.personalMod);
    const pYellow = calculateTotalPoints('yellow', habit.baseWeight, habit.personalMod);
    const pRed = calculateTotalPoints('red', habit.baseWeight, habit.personalMod);

    return (
      <div className={`bg-white rounded-3xl p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border transition-all hover:-translate-y-1 relative group ${habit.isFlagged ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-100'}`}>
        {habit.isFlagged && (
          <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl mb-4 flex items-center gap-2 text-xs font-bold animate-pulse">
            <AlertTriangle size={14} /> El Squad marcó esto.
          </div>
        )}

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
          <button onClick={() => { if (confirm('¿Borrar?')) setHabits(habits.filter(h => h.id !== habit.id)) }} className="text-slate-300 hover:text-rose-400">
            <Trash2 size={20} />
          </button>
        </div>

        <input
          type="text"
          placeholder={habit.status ? "Editar nota..." : "Agregar nota..."}
          value={habit.note}
          className="w-full text-xs bg-slate-50 border-none rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 transition-all outline-none"
          onChange={(e) => setHabits(habits.map(h => h.id === habit.id ? { ...h, note: e.target.value } : h))}
        />

        <div className="grid grid-cols-3 gap-2">
          {[{ s: 'green', v: pGreen, bg: 'bg-emerald-500', i: '🟢' }, { s: 'yellow', v: pYellow, bg: 'bg-amber-400', i: '🟡' }, { s: 'red', v: pRed, bg: 'bg-rose-500', i: '🔴' }].map((opt) => (
            <button
              key={opt.s}
              onClick={() => handleLog(habit.id, opt.s)}
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

  const LoginScreen = () => (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-slate-900">SOCIAL LAB</h1>
          <p className="text-slate-400 font-medium">Master Edition v4</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2">Nombre de Agente</label>
            <input name="username" required placeholder="Tu Nombre" className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase ml-2">Color de Aura</label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                <label key={color} className="cursor-pointer">
                  <input type="radio" name="color" value={color} className="peer sr-only" />
                  <div className="w-full aspect-square rounded-full bg-slate-100 peer-checked:ring-4 ring-offset-2 ring-indigo-500 transition-all" style={{ backgroundColor: color }}></div>
                </label>
              ))}
            </div>
          </div>
          <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
            Inicializar
          </button>
        </form>
      </div>
    </div>
  );

  // --- RENDER ---

  if (!user) return <LoginScreen />;

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
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const newH = {
                    id: Date.now(),
                    name: e.target.hname.value,
                    baseWeight: Number(e.target.hweight.value),
                    personalMod: Number(e.target.hmod.value),
                    status: null, note: '', isFlagged: false
                  };
                  setHabits([...habits, newH]);
                  setShowHabitCreator(false);
                  showToast('Protocolo Iniciado', 'Añadido a tu lista.', <Plus size={16} />);
                }} className="space-y-3">
                  <input name="hname" required placeholder="Nombre (ej. Leer)" className="w-full p-2 rounded-xl border-none text-sm" />
                  <select name="hweight" className="w-full p-2 rounded-xl text-sm"><option value="1">Fácil Base</option><option value="2">Medio Base</option><option value="3">Difícil Base</option></select>
                  <select name="hmod" className="w-full p-2 rounded-xl text-sm"><option value="1.0">Normal (1.0x)</option><option value="1.5">Difícil (1.5x)</option><option value="0.5">Fácil (0.5x)</option></select>
                  <button className="w-full bg-indigo-600 text-white p-2 rounded-xl font-bold text-sm">Crear</button>
                </form>
              </div>
            )}

            {habits.map(habit => <HabitCard key={habit.id} habit={habit} />)}
          </div>
        )}

        {activeTab === 'squad' && (
          <div className="space-y-5 animate-in fade-in duration-500">
            <div className="bg-indigo-600 rounded-3xl p-6 text-center text-white shadow-xl relative overflow-hidden">
              <h2 className="text-2xl font-black italic tracking-tighter relative z-10">CLASIFICACIÓN</h2>
              <p className="text-indigo-200 text-xs relative z-10">Compitiendo con 2 agentes</p>
            </div>
            {[user, ...squad].sort((a, b) => b.points - a.points).map((member, idx) => (
              <div key={member.id || idx} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="font-black text-slate-200 text-xl w-6">{idx + 1}</div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: member.auraColor }}>{member.name[0]}</div>
                  <div>
                    <p className="font-bold text-slate-800">{member.name} {member.id === user.id && '(Tú)'}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-indigo-500">{member.points} pts</span>
                      {member.streak > 0 && <span className="flex items-center gap-1"><Flame size={10} /> {member.streak}</span>}
                    </div>
                  </div>
                </div>
                {member.id !== user.id && (
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
                    onClick={() => {
                      if (user.points >= item.cost) {
                        setUser(u => ({ ...u, points: u.points - item.cost }));
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

        {activeTab === 'profile' && (
          <div className="space-y-6 pt-10 text-center">
            <div className="w-32 h-32 mx-auto rounded-full text-5xl flex items-center justify-center text-white font-black shadow-2xl" style={{ backgroundColor: user.auraColor }}>{user.name[0]}</div>
            <h2 className="text-4xl font-black italic text-slate-900">{user.name}</h2>

            <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-500">Notificaciones 8 PM</span>
                <button onClick={handleRequestNotification} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-xs font-bold">Activar</button>
              </div>
              <div className="h-px bg-slate-100"></div>
              <button onClick={handleSignOut} className="w-full py-3 text-rose-500 font-black bg-rose-50 rounded-xl">Cerrar Sesión</button>
            </div>
          </div>
        )}
      </main>

      {/* Nav */}
      <nav className="fixed bottom-8 left-6 right-6 max-w-lg mx-auto h-20 bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-50 flex items-center justify-evenly z-50 px-2">
        {[{ id: 'dashboard', icon: <TrendingUp size={24} /> }, { id: 'squad', icon: <Users size={24} /> }, { id: 'store', icon: <Store size={24} /> }, { id: 'profile', icon: <Settings size={24} /> }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-4 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-slate-900 text-white -translate-y-6 shadow-xl shadow-slate-900/20 scale-110' : 'text-slate-300 hover:text-indigo-400'}`}>
            {tab.icon}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
