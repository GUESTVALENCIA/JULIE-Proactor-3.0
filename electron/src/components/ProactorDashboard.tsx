import { useState, useEffect } from 'react'
import {
  Calendar,
  Brain,
  MessageSquare,
  CheckCircle2,
  Clock,
  ChevronRight,
  X,
  Zap,
  AlertTriangle,
  Lightbulb,
  Target,
  FileText,
  RotateCcw,
  Mic,
  Paperclip,
  Send
} from 'lucide-react'

interface Reservation {
  id: string
  guestName: string
  property: string
  status: 'check-in' | 'check-out' | 'active'
  date: string
  urgent?: boolean
}

const MOCK_RESERVATIONS: Reservation[] = [
  { id: '1', guestName: 'Maria López', property: 'Dúplex Montanejos', status: 'active', date: 'Hoy' },
  { id: '2', guestName: 'Sophie Martin', property: 'El Cabanyal', status: 'check-in', date: 'Hoy', urgent: true },
]

export function ProactorDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS)
  const [activeTab, setActiveTab] = useState('todo')
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null)
  const [visionData, setVisionData] = useState<any[]>([])

  useEffect(() => {
    const loadVision = async () => {
      try {
        const visions = await window.juliet.memory.jules.getAll()
        setVisionData(visions)
      } catch {}
    }
    loadVision()
    const interval = setInterval(loadVision, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleAction = async (action: string) => {
    if (!selectedRes) return
    console.log(`Ejecutando ${action} para ${selectedRes.guestName}`)
    await window.juliet.memory.tasks.create({
      description: `${action}: Reserva de ${selectedRes.guestName} en ${selectedRes.property}`,
      command: `echo "Procesando ${action}..."`
    })
    setSelectedRes(null)
  }

  return (
    <div className="flex flex-col h-full bg-[#020617] text-[#f8fafc] overflow-y-auto custom-scrollbar">
      {/* Header Info - Contexto / Modelos (Estilo Nueva Captura) */}
      <div className="sticky top-0 z-30 bg-[#020617]/90 backdrop-blur-xl px-8 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                  <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="113" strokeDashoffset="113" className="text-accent" />
                </svg>
                <span className="absolute text-[10px] font-bold">0%</span>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Contexto</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative w-10 h-10 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/5" />
                  <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="113" strokeDashoffset="0" className="text-emerald-500" />
                </svg>
                <span className="absolute text-[10px] font-bold">100%</span>
             </div>
             <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Free</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e293b]/50 border border-white/10 text-xs font-bold">
            <span className="text-sky-400">PRO</span> <span className="text-white/20">/</span> <span>OpenRouter Auto</span>
            <div className="flex gap-0.5 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1e293b]/50 border border-white/10 text-xs font-bold">
            <span className="text-emerald-400">G4F</span> <span className="text-white/20">/</span> <span>Ilimitado</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[8px] uppercase">Free ∞</span>
          </div>
        </div>
      </div>

      <div className="p-10 space-y-12 max-w-7xl mx-auto w-full">
        {/* Main Brand Hero */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_0_40px_rgba(56,189,248,0.4)] animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">Proactor Intelligent</h1>
          <p className="text-xs font-bold text-sky-400 tracking-[0.3em] uppercase">Juliet (Yulex) <span className="text-white/20 mx-2">—</span> Orquestacion activa</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna Izquierda: Reservas */}
          <section className="p-8 rounded-[3rem] bg-[#0f172a]/40 border border-white/5 space-y-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Calendar size={20} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.25em]">Reservas</h2>
                </div>
                <div className="w-8 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-black shadow-lg shadow-red-500/20">2</div>
             </div>

             <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-black text-sky-400">1</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">Check-in hoy</div>
                </div>
                <div className="text-center border-x border-white/5">
                  <div className="text-2xl font-black text-red-400">1</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">Check-out hoy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-400">1</div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">Activas</div>
                </div>
             </div>

             <div className="space-y-3 mt-8">
                {reservations.map(res => (
                  <button
                    key={res.id}
                    onClick={() => setSelectedRes(res)}
                    className={`w-full group flex items-center gap-4 p-5 rounded-[2rem] border transition-all text-left ${selectedRes?.id === res.id ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'}`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-black">B</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{res.guestName}</div>
                      <div className="text-[10px] text-muted font-medium truncate uppercase tracking-wider">{res.property}</div>
                    </div>
                    {res.urgent && (
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-2" />
                    )}
                    <div className={`w-2 h-2 rounded-full ${res.status === 'active' ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]' : 'bg-red-400'}`} />
                  </button>
                ))}
             </div>
          </section>

          {/* Columna Derecha: Juliet Mind */}
          <section className="p-8 rounded-[3rem] bg-[#0f172a]/40 border border-white/5 space-y-6 shadow-2xl backdrop-blur-sm relative flex flex-col">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Brain size={20} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.25em]">Juliet Mind</h2>
                </div>
                <div className="flex gap-2">
                   <button className="p-2 rounded-xl bg-white/5 text-muted hover:text-white transition-colors"><RotateCcw size={14} /></button>
                   <button className="p-2 rounded-xl bg-white/5 text-muted hover:text-white transition-colors"><ChevronRight size={14} className="rotate-90" /></button>
                </div>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-[2.5rem] mt-4">
                {visionData.length > 0 ? (
                   <div className="w-full text-left space-y-4">
                      {visionData.slice(0, 4).map((v, i) => (
                        <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0 shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                          <div className="text-[11px] leading-relaxed text-purple-100/80">
                            <span className="font-black text-purple-300 uppercase tracking-tighter mr-1">{v.category}:</span> {v.content}
                          </div>
                        </div>
                      ))}
                   </div>
                ) : (
                  <>
                    <p className="text-xs text-muted font-bold italic opacity-60">Juliet esta lista. Envía un mensaje para activar la reflexion.</p>
                  </>
                )}
             </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-8">
           {/* Insights (Ahora a ancho completo tras eliminar transcripción) */}
           <section className="p-8 rounded-[3rem] bg-[#0f172a]/40 border border-white/5 space-y-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Zap size={20} />
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-[0.25em]">Insights</h2>
                </div>
                <div className="flex gap-1">
                   {['Todo', 'Alert', 'Idea', 'Task', 'Log'].map((t, i) => (
                     <button key={t} className={`p-2 rounded-xl transition-colors ${i === 0 ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-muted hover:text-white'}`}>
                        {i === 1 ? <AlertTriangle size={14} /> : i === 2 ? <Lightbulb size={14} /> : i === 3 ? <Target size={14} /> : i === 4 ? <FileText size={14} /> : <span className="text-[9px] font-black uppercase px-1">Todo</span>}
                     </button>
                   ))}
                </div>
              </div>
              <div className="h-40 border border-dashed border-white/5 rounded-[2.5rem] p-6 space-y-3">
                 <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <Target size={14} className="text-sky-400" />
                    <div className="text-[10px] font-bold text-sky-100/70">Mapeo de arquitectura V3 completado.</div>
                 </div>
              </div>
           </section>
        </div>

        {/* Input area flotante */}
        <div className="fixed bottom-10 left-[calc(50%+40px)] -translate-x-1/2 w-full max-w-4xl px-6 z-40">
           <div className="p-3 rounded-[2.5rem] bg-[#1e293b]/80 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4">
              <button className="p-4 rounded-[1.5rem] bg-white/5 text-muted hover:text-white transition-all"><Mic size={20} /></button>
              <button className="p-4 rounded-[1.5rem] bg-white/5 text-muted hover:text-white transition-all"><Paperclip size={20} /></button>
              <input
                type="text"
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium px-2"
              />
              <button className="p-4 rounded-[1.5rem] bg-sky-500 text-[#020617] hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20"><Send size={20} /></button>
           </div>
        </div>

        {/* Padding final para el input */}
        <div className="h-32" />
      </div>

      {/* Modal Accion (Aumentado estilo) */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
           <div className="w-full max-w-lg p-10 rounded-[4rem] bg-[#0f172a] border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-3xl bg-sky-500/20 flex items-center justify-center text-sky-400 font-black text-xl">B</div>
                   <div>
                      <h3 className="text-xl font-black">{selectedRes.guestName}</h3>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{selectedRes.property}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedRes(null)} className="p-3 bg-white/5 rounded-2xl text-muted hover:text-white transition-all"><X size={20} /></button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <ActionButton icon={CheckCircle2} label="Confirmar Entrada" color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" onClick={() => handleAction('check-in')} />
                <ActionButton icon={MessageSquare} label="Mensaje de Bienvenida" color="bg-sky-500/10 text-sky-400 border-sky-500/20" onClick={() => handleAction('welcome-msg')} />
                <ActionButton icon={Clock} label="Posponer Accion" color="bg-amber-500/10 text-amber-400 border-amber-500/20" onClick={() => handleAction('delay')} />
                <ActionButton icon={Brain} label="Delegar a Jules (Autonomo)" color="bg-purple-500/10 text-purple-400 border-purple-500/20" onClick={() => handleAction('delegate')} />
              </div>
           </div>
        </div>
      )}
    </div>
  )
}

function ActionButton({ icon: Icon, label, color, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-5 rounded-[2rem] border transition-all hover:scale-[1.02] active:scale-[0.98] font-bold text-sm ${color}`}
    >
      <Icon size={22} />
      {label}
      <ChevronRight size={18} className="ml-auto opacity-40" />
    </button>
  )
}
