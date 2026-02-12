import React from 'react';

const EmojiSelector = ({ onSelect, selected }) => {
    const emojis = ['⚡', '🔥', '✨', '💎', '🚀', '💪', '🧠', '📚', '🎨', '💸', '🥗', '🏋️', '🧘', '🎵', '🍿', '🏷️', '🚫', '🗺️', '🎙️', '🎤', '🖼️', '🔮', '☀️', '🛡️', '🎭', '🔕', '🎰', '🤡', '🤐', '🐸', '🧐', '🍦', '🚗', '☕', '🎁', '🧹'];

    return (
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
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

export default EmojiSelector;
