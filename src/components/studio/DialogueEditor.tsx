import React, { useState } from 'react';
import { Plus, Trash2, Users, Play, Sparkles } from 'lucide-react';
import { SpeakerTurn } from '../../types/project';
import { Voice } from '../../types/tts';

interface DialogueEditorProps {
  turns: SpeakerTurn[];
  voices: Voice[];
  onChangeTurns: (turns: SpeakerTurn[]) => void;
  onPreviewTurn?: (turn: SpeakerTurn) => void;
}

const DEFAULT_SPEAKERS = [
  'Narrator',
  'Teacher',
  'Student',
  'Male Character',
  'Female Character',
  'Pehel',
  'Custom'
];

export const DialogueEditor: React.FC<DialogueEditorProps> = ({
  turns,
  voices,
  onChangeTurns,
  onPreviewTurn,
}) => {
  const addTurn = () => {
    const lastTurn = turns[turns.length - 1];
    const nextSpeaker = lastTurn?.speaker === 'Narrator' ? 'Student' : 'Narrator';
    const newTurn: SpeakerTurn = {
      id: `turn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      speaker: nextSpeaker,
      text: '',
      voiceId: voices[0]?.id || 'voice-gemini-kore',
      style: 'Natural conversational inflection',
    };
    onChangeTurns([...turns, newTurn]);
  };

  const updateTurn = (id: string, updates: Partial<SpeakerTurn>) => {
    onChangeTurns(
      turns.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const removeTurn = (id: string) => {
    onChangeTurns(turns.filter((t) => t.id !== id));
  };

  const loadDialogueExample = () => {
    const exampleTurns: SpeakerTurn[] = [
      {
        id: 'turn-1',
        speaker: 'Narrator',
        text: 'उस रात कुछ अजीब हुआ। दूर से कदमों की धीमी आवाज़ आ रही थी।',
        voiceId: 'voice-gemini-fenrir',
        style: 'Solemn documentary narrator, low ominous tension',
      },
      {
        id: 'turn-2',
        speaker: 'Pehel',
        text: 'मैडम, आपने भी वह आवाज़ सुनी? क्या कोई बाहर खड़ा है?',
        voiceId: 'voice-gemini-aoede',
        style: 'Anxious, trembling, youthful female whisper',
      },
      {
        id: 'turn-3',
        speaker: 'Teacher',
        text: 'हाँ, मैंने भी सुनी। सब शांत रहो, खिड़की से दूर हो जाओ।',
        voiceId: 'voice-gemini-kore',
        style: 'Cautious, protective, controlled adult female voice',
      },
    ];
    onChangeTurns(exampleTurns);
  };

  return (
    <div className="bg-[#15161b] border border-[#26282e] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-[#24262c] pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Multi-Speaker Dialogue Turns
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDialogueExample}
            className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
          >
            Load Example
          </button>
          <button
            onClick={addTurn}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Turn</span>
          </button>
        </div>
      </div>

      {turns.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <Users className="w-8 h-8 text-slate-600 mb-2" />
          <p>No dialogue turns defined. Click "Add Turn" or "Load Example" to start.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {turns.map((turn, index) => (
            <div
              key={turn.id}
              className="bg-[#18191e] border border-[#282a32] rounded-lg p-3 flex flex-col gap-2 relative group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">
                    #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={turn.speaker}
                    onChange={(e) => updateTurn(turn.id, { speaker: e.target.value })}
                    placeholder="Speaker name"
                    className="bg-[#121316] border border-[#2d3037] text-amber-300 font-semibold text-xs rounded px-2 py-1 w-28 focus:outline-none focus:border-amber-400"
                  />
                  <select
                    value={turn.voiceId}
                    onChange={(e) => updateTurn(turn.id, { voiceId: e.target.value })}
                    className="bg-[#121316] border border-[#2d3037] text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-amber-400"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.gender})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  {onPreviewTurn && (
                    <button
                      onClick={() => onPreviewTurn(turn)}
                      disabled={!turn.text.trim()}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 disabled:opacity-30"
                      title="Preview this speaker line"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeTurn(turn.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete turn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                value={turn.text}
                onChange={(e) => updateTurn(turn.id, { text: e.target.value })}
                placeholder={`Dialogue text for ${turn.speaker}...`}
                rows={2}
                className="w-full bg-[#121316] border border-[#26282e] rounded p-2 text-xs text-slate-200 resize-none focus:outline-none focus:border-amber-500/60"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
