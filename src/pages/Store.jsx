import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../hooks/useStore';
import { useStoreActions } from '../hooks/useStoreActions';
import { Zap, Plus, Store as StoreIcon, Trash2, AlertTriangle } from 'lucide-react';
import EmojiSelector from '../components/ui/EmojiSelector';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const StorePage = () => {
    const { userData } = useAuth();
    const { storeItems, loading } = useStore();
    const { handleBuy, handleCreateItem, handleDeleteItem } = useStoreActions();
    const [showStoreCreator, setShowStoreCreator] = useState(false);
    const [selectedStoreIcon, setSelectedStoreIcon] = useState('🎁');
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    if (loading) return <div className="p-8 text-center text-slate-400">Abriendo tienda...</div>;

    const onConfirmDelete = async () => {
        if (itemToDelete) {
            await handleDeleteItem(itemToDelete.id, itemToDelete.name);
            setDeleteModalOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-b-[3rem] -mx-6 px-8 pt-12 pb-10 text-white shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20"><Zap size={120} /></div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter relative z-10">La Tiendita</h2>
                <div className="mt-4 bg-white/20 inline-flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md font-black text-sm relative z-10">
                    <Zap size={14} className="fill-current" />
                    <span>{userData?.points || 0} Puntos Disponibles</span>
                </div>
            </div>

            <div className="px-2">
                <Button
                    variant="outline"
                    className="w-full py-8 border-dashed border-indigo-200 bg-indigo-50/30 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300"
                    onClick={() => setShowStoreCreator(true)}
                >
                    <Plus size={20} className="mr-2" />
                    Agregar Recompensa
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-2">
                {storeItems.map(item => (
                    <div key={item.id} className="bg-white rounded-[2rem] p-5 flex justify-between items-center border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
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
                            <Button
                                size="sm"
                                variant={userData?.points >= item.cost ? "primary" : "secondary"}
                                disabled={userData?.points < item.cost}
                                onClick={() => handleBuy(item)}
                                className={userData?.points < item.cost ? "opacity-50" : ""}
                            >
                                Canjear
                            </Button>

                            <button
                                onClick={() => {
                                    setItemToDelete(item);
                                    setDeleteModalOpen(true);
                                }}
                                className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {storeItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic">La tienda está vacía.</div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={showStoreCreator}
                onClose={() => setShowStoreCreator(false)}
                title="Nueva Recompensa"
            >
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const success = await handleCreateItem(e.target.name.value, e.target.cost.value, selectedStoreIcon);
                        if (success) setShowStoreCreator(false);
                    }}
                    className="space-y-4"
                >
                    <Input
                        name="name"
                        label="Nombre del Premio"
                        required
                        placeholder="Ej. El DJ Dictador"
                    />

                    <div>
                        <Input
                            name="cost"
                            type="number"
                            label="Costo (Pts)"
                            required
                            placeholder="250"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Icono</label>
                        <div className="mt-1">
                            <EmojiSelector onSelect={setSelectedStoreIcon} selected={selectedStoreIcon} />
                        </div>
                    </div>

                    <Button type="submit" className="w-full">
                        <StoreIcon size={18} className="mr-2" />
                        Publicar Recompensa
                    </Button>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="¿Eliminar?"
            >
                <div className="space-y-6">
                    <div className="flex flex-col items-center text-center p-4 bg-rose-50 rounded-[2rem] border border-rose-100">
                        <AlertTriangle className="text-rose-400 mb-2" size={32} />
                        <p className="text-slate-600 text-sm font-medium">
                            Estás a punto de eliminar <strong className="text-rose-500">"{itemToDelete?.name}"</strong>.
                            <br />Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" className="flex-1" onClick={onConfirmDelete}>Sí, Eliminar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StorePage;
