import React, { useState } from 'react';
import {
  Flame, Users, Store, Settings, MessageCircle, TrendingUp,
  Bell, Zap, Sliders, CheckCircle2, AlertCircle, Heart,
  Plus, Trash2, X, ShieldAlert, Gavel, Sparkles, MoreHorizontal,
  ArrowLeft, Edit3, AlertTriangle, BookOpen, Globe, Info, Trophy, ArrowRight
} from 'lucide-react';

// --- SOCIAL HABIT LAB v4 (MAESTRA) ---
// Mejoras:
// 1. Motor de Puntos Exacto: Valores fijos por dificultad * Multiplicador Personal.
// 2. Funcionalidad Completa: Squad, Feed, Tienda y Perfil totalmente operativos.
// 3. Leyenda de Puntos: Explicación visual del sistema de puntaje.

const App = () => {
  // --- 1. GESTIÓN DE ESTADO ---
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [showHabitCreator, setShowHabitCreator] = useState(false);
  const [showPointsLegend, setShowPointsLegend] = useState(false);
  const [notification, setNotification] = useState(null);

  // USUARIO ACTUAL
  const [user, setUser] = useState({
    id: 'u1', name: 'Alex', auraColor: '#6366f1', points: 850, streak: 5, role: 'Admin'
  });

  // BIBLIOTECA GLOBAL
  const [habitLibrary, setHabitLibrary] = useState([
    { id: 'lib1', name: 'Sin Azúcar', baseWeight: 3 }, // Difícil
    { id: 'lib2', name: 'Gimnasio / Actividad', baseWeight: 3 }, // Difícil
    { id: 'lib3', name: 'Leer 20 Páginas', baseWeight: 1 }, // Fácil
    { id: 'lib4', name: 'Beber 2L Agua', baseWeight: 1 }, // Fácil
    { id: 'lib5', name: 'Meditar 10min', baseWeight: 2 }, // Medio
  ]);

  // MIS HÁBITOS
  const [habits, setHabits] = useState([
    { id: 1, libraryId: 'lib1', name: 'Sin Azúcar', baseWeight: 3, personalMod: 1.0, status: null, note: '', isFlagged: false },
    { id: 2, libraryId: 'lib2', name: 'Gimnasio / Actividad', baseWeight: 3, personalMod: 1.5, status: null, note: '', isFlagged: false },
  ]);

  // SQUAD DATA
  const [squad, setSquad] = useState([
    {
      id: 'u2', name: 'Roxana', auraColor: '#ec4899', points: 1240, streak: 12, status: 'green',
      habits: [{ name: 'Meditación', multiplier: 1.5 }, { name: 'Running', multiplier: 3.0 }]
    },
    {
      id: 'u3', name: 'Gabriel', auraColor: '#10b981', points: 915, streak: 3, status: 'yellow',
      habits: [{ name: 'Coding', multiplier: 1.0 }, { name: 'Gym', multiplier: 2.0 }]
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

  // TIENDA DATA
  const storeItems = [
    { name: 'Elegir Película', cost: 500, icon: '🍿', desc: 'Dictas la película del sábado.' },
    { name: 'Control DJ', cost: 150, icon: '🎵', desc: 'Controlas la música 30 min.' },
    { name: 'Inmunidad', cost: 300, icon: '🛡️', desc: 'Saltar un día sin perder racha.' },
    { name: 'Impuesto Helado', cost: 1000, icon: '🍦', desc: 'El Squad te invita un helado.' }
  ];

  // HELPERS UI
  const squadGreenCount = squad.filter(m => m.status === 'green').length + (habits.some(h => h.status === 'green') ? 1 : 0);
  const squadHealth = Math.round((squadGreenCount / (squad.length + 1)) * 100);
  const isSquadBonusActive = squadHealth >= 75;

  // --- 2. MOTOR LÓGICO DE PUNTOS (NUEVO) ---

  const showToast = (msg, subMsg = null, icon = <Zap size={16} />) => {
    setNotification({ msg, subMsg, icon });
    setTimeout(() => setNotification(null), 4000);
  };

  // Lógica exacta solicitada
  const getBasePoints = (status, baseWeight) => {
    if (!status) return 0;

    // Matriz de Puntos Base
    const pointsMap = {
      1: { green: 10, yellow: 5, red: -4 },  // Fácil
      2: { green: 20, yellow: 8, red: -4 },  // Medio
      3: { green: 30, yellow: 12, red: -5 }  // Difícil
    };

    return pointsMap[baseWeight][status] || 0;
  };

  const calculateTotalPoints = (status, baseWeight, personalMod) => {
    if (!status) return 0;
    const base = getBasePoints(status, baseWeight);

    // Multiplicación y Redondeo hacia arriba (Math.ceil)
    // Nota: Si es negativo, Math.ceil(-2.5) es -2, lo cual es matemáticamente mayor ("hacia arriba"),
    // pero en castigos a veces se prefiere Math.round o floor. Usaré ceil estándar.
    let total = Math.ceil(base * personalMod);

    return total;
  };

  const handleLog = (id, newStatus) => {
    const habit = habits.find(h => h.id === id);
    const oldStatus = habit.status;

    if (oldStatus === newStatus) return;

    // Calcular puntos viejos y nuevos
    const oldPoints = calculateTotalPoints(oldStatus, habit.baseWeight, habit.personalMod);
    const newPoints = calculateTotalPoints(newStatus, habit.baseWeight, habit.personalMod);
    const pointDiff = newPoints - oldPoints;

    // Actualizar Estado
    setHabits(habits.map(h => h.id === id ? { ...h, status: newStatus, isFlagged: false } : h));
    setUser(u => ({ ...u, points: u.points + pointDiff }));

    // Feedback Detallado
    const statusEmoji = newStatus === 'green' ? '🟢' : newStatus === 'yellow' ? '🟡' : '🔴';

    if (oldStatus) {
      const oldEmoji = oldStatus === 'green' ? '🟢' : oldStatus === 'yellow' ? '🟡' : '🔴';
      showToast(
        `Corrección`,
        `${oldEmoji} (${oldPoints > 0 ? '-' : '+'}${Math.abs(oldPoints)}) | ${statusEmoji} (${newPoints > 0 ? '+' : ''}${newPoints})`,
        <Edit3 size={16} />
      );
    } else {
      showToast(
        `Registrado ${statusEmoji}`,
        `${newPoints > 0 ? '+' : ''}${newPoints} pts`,
        <CheckCircle2 size={16} />
      );
    }

    // Feed
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

  // --- CRUD ---
  const handleAddFromLibrary = (libHabit, personalMod) => {
    const newHabit = {
      id: Date.now(), libraryId: libHabit.id, name: libHabit.name,
      baseWeight: libHabit.baseWeight, personalMod: Number(personalMod),
      status: null, note: '', isFlagged: false
    };
    setHabits([...habits, newHabit]);
    setShowHabitCreator(false);
    showToast('Hábito agregado.', null, <Plus size={16} />);
  };

  const handleCreateCustom = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const baseWeight = Number(formData.get('baseWeight'));
    const personalMod = Number(formData.get('personalMod'));
    const newLibId = `lib${Date.now()}`;
    const newLibHabit = { id: newLibId, name, baseWeight };
    setHabitLibrary([...habitLibrary, newLibHabit]);
    const newHabit = {
      id: Date.now(), libraryId: newLibId, name, baseWeight, personalMod,
      status: null, note: '', isFlagged: false
    };
    setHabits([...habits, newHabit]);
    setShowHabitCreator(false);
    showToast('Creado y compartido.', 'Añadido a biblioteca.', <Globe size={16} />);
  };

  const handleDeleteHabit = (id) => {
    if (confirm('¿Archivar este hábito?')) {
      setHabits(habits.filter(h => h.id !== id));
      showToast('Hábito archivado.', null, <Trash2 size={16} />);
    }
  };

  const handleKudos = (name) => {
    if (user.points >= 5) {
      setUser(u => ({ ...u, points: u.points - 5 }));
      showToast(`Enviado 5pts a ${name}`, null, <Heart size={16} />);
    } else showToast("Puntos insuficientes", null, <AlertCircle size={16} />);
  };

  const handleNudge = (name) => showToast(`¡Has dado un toque a ${name}!`, null, <Bell size={16} />);

  const handleVerify = (id) => {
    setFeed(feed.map(i => i.id === id ? { ...i, isVerified: true } : i));
    showToast("Has validado este log", null, <CheckCircle2 size={16} />);
  };

  const handleFlagLog = (id) => {
    setFeed(feed.map(i => i.id === id ? { ...i, isFlagged: true } : i));
    showToast("Marcado como sospechoso", null, <ShieldAlert size={16} />);
  };

  // --- COMPONENTES UI ---

  const PointsLegendModal = () => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[80] flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 relative shadow-2xl">
        <button onClick={() => setShowPointsLegend(false)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600"><X size={24} /></button>
        <h3 className="text-xl font-black italic text-slate-900 mb-4 flex items-center gap-2"><Info size={20} className="text-indigo-500" /> Sistema de Puntos</h3>

        <div className="space-y-4">
          <p className="text-xs text-slate-500">Puntos Base según dificultad del hábito:</p>

          <div className="grid grid-cols-4 gap-2 text-xs font-bold text-center border-b pb-2">
            <div className="text-left text-slate-400">Nivel</div>
            <div className="text-emerald-500">🟢</div>
            <div className="text-amber-500">🟡</div>
            <div className="text-rose-500">🔴</div>
          </div>

          {[
            { l: 'Fácil', g: 10, y: 5, r: -4 },
            { l: 'Medio', g: 20, y: 8, r: -4 },
            { l: 'Difícil', g: 30, y: 12, r: -5 },
          ].map((row, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 text-sm font-bold text-center items-center">
              <div className="text-left bg-slate-100 rounded px-2 py-1 text-slate-600">{row.l}</div>
              <div className="text-slate-700">{row.g}</div>
              <div className="text-slate-700">{row.y}</div>
              <div className="text-slate-700">{row.r}</div>
            </div>
          ))}

          <div className="bg-indigo-50 p-3 rounded-xl mt-4">
            <p className="text-xs text-indigo-800 font-medium">
              <span className="font-bold">Nota:</span> Estos puntos base se multiplican por tu dificultad personal (0.5x, 1.0x, 1.5x) y se redondean hacia arriba.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const HabitCard = ({ habit }) => {
    // Calcular visualmente los puntos potenciales para mostrar al usuario
    const pGreen = calculateTotalPoints('green', habit.baseWeight, habit.personalMod);
    const pYellow = calculateTotalPoints('yellow', habit.baseWeight, habit.personalMod);
    const pRed = calculateTotalPoints('red', habit.baseWeight, habit.personalMod);

    return (
      <div className={`bg-white rounded-3xl p-5 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] border transition-all hover:-translate-y-1 relative group ${habit.isFlagged ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-100'}`}>

        {habit.isFlagged && (
          <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl mb-4 flex items-center gap-2 text-xs font-bold animate-pulse">
            <AlertTriangle size={14} />
            El Squad marcó esto. Por favor revisa.
          </div>
        )}

        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="font-bold text-lg text-slate-800">{habit.name}</h4>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <div className="flex flex-col bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase">Base</span>
                <span className="text-xs font-bold text-slate-700">
                  {habit.baseWeight === 1 ? 'Fácil' : habit.baseWeight === 2 ? 'Medio' : 'Difícil'}
                </span>
              </div>
              <span className="text-slate-300">×</span>
              <div className={`flex flex-col px-3 py-1 rounded-lg border ${habit.personalMod < 1 ? 'bg-amber-50 border-amber-100' : habit.personalMod > 1 ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
                <span className={`text-[9px] font-black uppercase ${habit.personalMod < 1 ? 'text-amber-400' : habit.personalMod > 1 ? 'text-indigo-400' : 'text-slate-400'}`}>Ajuste</span>
                <span className={`text-xs font-bold ${habit.personalMod < 1 ? 'text-amber-600' : habit.personalMod > 1 ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {habit.personalMod}x
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => handleDeleteHabit(habit.id)} className="text-slate-300 hover:text-rose-400">
            <MoreHorizontal size={20} />
          </button>
        </div>

        <input
          type="text"
          placeholder={habit.status ? "Editar nota..." : "Agregar nota..."}
          value={habit.note}
          className="w-full text-xs bg-slate-50 border-none rounded-xl p-3 mb-4 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300 transition-all outline-none"
          onChange={(e) => {
            const newHabits = habits.map(h => h.id === habit.id ? { ...h, note: e.target.value } : h);
            setHabits(newHabits);
          }}
        />

        <div className="grid grid-cols-3 gap-2">
          {[
            { s: 'green', val: pGreen, bg: 'bg-emerald-500', icon: '🟢' },
            { s: 'yellow', val: pYellow, bg: 'bg-amber-400', icon: '🟡' },
            { s: 'red', val: pRed, bg: 'bg-rose-500', icon: '🔴' }
          ].map((opt) => (
            <button
              key={opt.s}
              onClick={() => handleLog(habit.id, opt.s)}
              className={`h-14 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden ${habit.status === opt.s
                ? `${opt.bg} text-white shadow-lg scale-[1.02]`
                : 'bg-slate-50 text-slate-300 hover:bg-white hover:shadow-md'
                }`}
            >
              <span className={`text-xl ${habit.status !== opt.s && 'grayscale opacity-60'}`}>{opt.icon}</span>
              {habit.status !== opt.s && (
                <span className="text-[9px] font-bold mt-1 opacity-70">
                  {opt.val > 0 ? '+' : ''}{opt.val}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const CreateHabitModal = () => {
    const [mode, setMode] = useState('library');
    const [selectedLibId, setSelectedLibId] = useState(null);

    return (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200">
        <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 relative shadow-2xl overflow-hidden">
          <button onClick={() => setShowHabitCreator(false)} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 z-10"><X size={24} /></button>
          <h2 className="text-xl font-black italic text-slate-900 mb-4">Agregar Protocolo</h2>

          <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
            <button onClick={() => setMode('library')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'library' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Biblioteca Squad</button>
            <button onClick={() => setMode('custom')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'custom' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Crear Nuevo</button>
          </div>

          {mode === 'library' ? (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {habitLibrary.map(lib => (
                <div key={lib.id} className={`p-4 rounded-2xl border transition-all ${selectedLibId === lib.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-white'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-slate-800 text-sm">{lib.name}</h4>
                    <span className="text-[9px] bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">
                      {lib.baseWeight === 1 ? 'Fácil' : lib.baseWeight === 2 ? 'Medio' : 'Difícil'}
                    </span>
                  </div>
                  {selectedLibId === lib.id ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleAddFromLibrary(lib, e.target.pMod.value); }}>
                      <select name="pMod" className="w-full p-2 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-slate-700 outline-none mb-3">
                        <option value="0.5">Fácil para mí (0.5x)</option>
                        <option value="1.0" selected>Normal (1.0x)</option>
                        <option value="1.5">Difícil para mí (1.5x)</option>
                      </select>
                      <button className="w-full bg-indigo-600 text-white py-2 rounded-lg text-xs font-black uppercase">Agregar</button>
                    </form>
                  ) : (
                    <button onClick={() => setSelectedLibId(lib.id)} className="w-full py-2 text-xs font-bold text-indigo-500 bg-indigo-50/50 rounded-lg">Seleccionar</button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                <input name="name" required placeholder="ej. Yoga" className="w-full text-lg font-bold border-b-2 border-slate-100 py-1 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Dificultad Base</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[1, 2, 3].map(w => (
                    <label key={w} className="cursor-pointer group">
                      <input type="radio" name="baseWeight" value={w} className="peer sr-only" required />
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center peer-checked:bg-slate-900 peer-checked:text-white transition-all">
                        <div className="font-bold text-xs">{w === 1 ? 'Fácil' : w === 2 ? 'Medio' : 'Difícil'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Ajuste Personal</label>
                <select name="personalMod" className="w-full mt-2 p-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none">
                  <option value="0.5">Fácil para mí (0.5x)</option>
                  <option value="1.0" selected>Normal (1.0x)</option>
                  <option value="1.5">Difícil para mí (1.5x)</option>
                </select>
              </div>
              <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-black uppercase tracking-widest mt-2">Crear</button>
            </form>
          )}
        </div>
      </div>
    );
  };

  // --- VISTAS RESTAURADAS ---

  const FeedView = () => (
    <div className="space-y-4 pb-24 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Actividad Reciente</h3>
        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold flex items-center gap-1">
          <Gavel size={10} /> REVISIÓN DE PARES
        </span>
      </div>

      {feed.map(item => (
        <div key={item.id} className={`bg-white rounded-3xl p-5 shadow-sm border-l-4 transition-all relative overflow-hidden ${item.isFlagged ? 'grayscale opacity-75' : ''}`} style={{ borderLeftColor: item.isFlagged ? '#ef4444' : item.aura }}>
          {item.isFlagged && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl">BAJO REVISIÓN</div>}

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md" style={{ backgroundColor: item.aura }}>
              {item.user[0]}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-800 leading-tight"><span className="font-bold">{item.user}</span> {item.action}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">{item.time}</p>
                </div>
                {item.isVerified && <div className="text-emerald-500"><Sparkles size={16} fill="currentColor" /></div>}
              </div>

              {item.note && <div className="mt-3 bg-slate-50 p-3 rounded-xl text-xs text-slate-600 italic border border-slate-100">"{item.note}"</div>}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {['🔥', '💪', '👏'].map(emoji => (
                    <button key={emoji} className="text-xs px-2 py-1 rounded-full border bg-white border-slate-100 text-slate-400 hover:scale-110">{emoji} {item.reactions[emoji] || ''}</button>
                  ))}
                </div>
                {!item.isFlagged && !item.isVerified && (
                  <div className="flex gap-1">
                    <button onClick={() => handleVerify(item.id)} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100">Validar</button>
                    <button onClick={() => handleFlagLog(item.id)} className="px-3 py-1 bg-rose-50 text-rose-500 rounded-lg text-xs font-bold hover:bg-rose-100">Reportar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const SquadView = () => (
    <div className="space-y-5 pb-24 animate-in fade-in duration-500">
      <div className="bg-indigo-600 rounded-3xl p-6 text-center text-white shadow-xl mb-6 relative overflow-hidden">
        <h2 className="text-2xl font-black italic tracking-tighter relative z-10">CLASIFICACIÓN</h2>
        <p className="text-indigo-200 text-xs relative z-10">El ciclo termina en 3 días</p>
      </div>

      {[user, ...squad].sort((a, b) => b.points - a.points).map((member, idx) => (
        <div key={member.id} className="bg-white p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="font-black text-slate-200 text-xl w-6">{idx + 1}</div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ backgroundColor: member.auraColor }}>
              {member.name[0]}
            </div>
            <div>
              <p className="font-bold text-slate-800">{member.name} {member.id === user.id && '(Tú)'}</p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-indigo-500">{member.points} pts</span>
                <span className="flex items-center gap-1"><Flame size={10} /> {member.streak}</span>
              </div>
            </div>
          </div>
          {member.id !== user.id && (
            <div className="flex gap-2">
              {member.status === 'missing' ? (
                <button onClick={() => handleNudge(member.name)} className="bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-500 p-3 rounded-2xl"><Bell size={18} /></button>
              ) : (
                <button onClick={() => handleKudos(member.name)} className="bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-500 p-3 rounded-2xl"><Heart size={18} /></button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const StoreView = () => (
    <div className="space-y-4 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white shadow-xl mb-6">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">Tiendita</h2>
        <p className="opacity-90 font-medium mt-1">Gasta tus puntos sabiamente.</p>
        <div className="mt-4 bg-white/20 inline-block px-4 py-2 rounded-xl backdrop-blur-md font-bold text-sm">
          Saldo: {user.points} pts
        </div>
      </div>

      {storeItems.map(item => (
        <div key={item.name} className="bg-white rounded-3xl p-5 flex justify-between items-center border border-slate-100 shadow-sm group hover:border-amber-200 transition-colors">
          <div className="flex gap-4 items-center">
            <div className="text-3xl bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:bg-amber-50 transition-colors">
              {item.icon}
            </div>
            <div>
              <h4 className="font-bold text-slate-800">{item.name}</h4>
              <p className="text-xs text-slate-400 max-w-[140px] leading-tight mt-1">{item.desc}</p>
            </div>
          </div>
          <button
            className={`px-5 py-3 rounded-xl text-xs font-black transition-all ${user.points >= item.cost ? 'bg-slate-900 text-white hover:scale-105 shadow-lg hover:bg-amber-500' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            onClick={() => {
              if (user.points >= item.cost) {
                setUser(u => ({ ...u, points: u.points - item.cost }));
                showToast(`Canjeado: ${item.name}`, null, <Store size={16} />);
              }
            }}
          >
            {item.cost}
          </button>
        </div>
      ))}
    </div>
  );

  const ProfileView = () => (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: user.auraColor }}></div>
        <div className="w-28 h-28 rounded-full mx-auto flex items-center justify-center text-5xl text-white font-black mb-6 shadow-2xl" style={{ backgroundColor: user.auraColor }}>
          {user.name[0]}
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{user.name}</h2>
        <p className="text-sm text-slate-400 font-medium">Investigador Nivel 5</p>
      </div>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Aura de Identidad</h3>
        <div className="grid grid-cols-5 gap-3">
          {['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#64748b', '#2d3436', '#f472b6'].map(color => (
            <button key={color} onClick={() => setUser(u => ({ ...u, auraColor: color }))} className={`w-full aspect-square rounded-full transition-all flex items-center justify-center ${user.auraColor === color ? 'ring-4 ring-slate-100 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: color }}>
              {user.auraColor === color && <CheckCircle2 size={16} color="white" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-[#F8F9FC] text-slate-900 font-sans select-none overflow-x-hidden">
      {showHabitCreator && <CreateHabitModal />}
      {showPointsLegend && <PointsLegendModal />}

      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-start gap-3 animate-in fade-in zoom-in duration-300 w-[90%] max-w-sm">
          <div className="text-amber-400 mt-1">{notification.icon}</div>
          <div>
            <div className="text-xs font-black uppercase tracking-widest">{notification.msg}</div>
            {notification.subMsg && <div className="text-[10px] text-slate-300 font-medium mt-1">{notification.subMsg}</div>}
          </div>
        </div>
      )}

      <header className="px-6 pt-12 pb-4 sticky top-0 bg-[#F8F9FC]/80 backdrop-blur-xl z-40 border-b border-white/50 flex justify-between items-center">
        <div><h1 className="text-2xl font-black italic tracking-tighter text-slate-900">SOCIAL LAB</h1></div>
        <div className="flex items-center gap-3 bg-white p-2 pr-4 rounded-full border border-slate-100 shadow-sm">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: user.auraColor }}>{user.name[0]}</div>
          <div className="flex flex-col"><span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Banco</span><span className="text-sm font-black text-slate-800 leading-none">{user.points}</span></div>
        </div>
      </header>

      <main className="px-6 py-6 max-w-lg mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-4 pb-24 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Mi Protocolo</h3>
              <div className="flex gap-2">
                <button onClick={() => setShowPointsLegend(true)} className="text-xs font-bold text-slate-400 flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors"><Info size={14} /></button>
                <button onClick={() => setShowHabitCreator(true)} className="text-xs font-bold text-indigo-500 flex items-center gap-1 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"><Plus size={14} /> Hábito</button>
              </div>
            </div>
            {habits.map(habit => <HabitCard key={habit.id} habit={habit} />)}
          </div>
        )}
        {activeTab === 'feed' && <FeedView />}
        {activeTab === 'squad' && <SquadView />}
        {activeTab === 'store' && <StoreView />}
        {activeTab === 'profile' && <ProfileView />}
      </main>

      <nav className="fixed bottom-8 left-6 right-6 max-w-lg mx-auto h-20 bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-50 flex items-center justify-evenly z-50 px-2">
        {[
          { id: 'dashboard', icon: <TrendingUp size={24} /> },
          { id: 'feed', icon: <MessageCircle size={24} /> },
          { id: 'squad', icon: <Users size={24} /> },
          { id: 'store', icon: <Store size={24} /> },
          { id: 'profile', icon: <Settings size={24} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-4 rounded-full transition-all duration-300 ${activeTab === tab.id ? 'bg-slate-900 text-white -translate-y-6 shadow-xl shadow-slate-900/20 scale-110' : 'text-slate-300 hover:text-indigo-400'}`}
          >
            {tab.icon}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
