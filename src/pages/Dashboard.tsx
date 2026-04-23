import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeTable } from '@/hooks/use-realtime-table';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, ChevronRight, Church, Music, Users, Plus, CalendarDays, Shirt, Sparkles, Scissors, BarChart3, X, Trash2 } from 'lucide-react';

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

export default function Dashboard() {
  const { isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [escalaOpen, setEscalaOpen] = useState(false);

  useRealtimeTable(
    ['schedules', 'schedule_members', 'schedule_outfits', 'schedule_accessories', 'members', 'outfits', 'accessories'],
    [['schedules'], ['members-active'], ['outfits-all'], ['accessories-all']],
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const { data: schedules = [], refetch: refetchSchedules } = useQuery({
    queryKey: ['schedules', year, month],
    queryFn: async () => {
      const { data } = await supabase
        .from('schedules')
        .select('*, schedule_outfits(*, outfits(*)), schedule_members(*, members(*)), schedule_accessories(*, accessories(*))')
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'));
      return data ?? [];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members-active'],
    queryFn: async () => {
      const { data } = await supabase.from('members').select('*').eq('status', 'active').order('name');
      return data ?? [];
    },
  });

  const { data: outfits = [] } = useQuery({
    queryKey: ['outfits-all'],
    queryFn: async () => {
      const { data } = await supabase.from('outfits').select('*').order('name');
      return data ?? [];
    },
  });

  const { data: accessories = [] } = useQuery({
    queryKey: ['accessories-all'],
    queryFn: async () => {
      const { data } = await supabase.from('accessories').select('*').order('name');
      return data ?? [];
    },
  });

  const selectedSchedule = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return schedules.find((s: any) => s.date === dateStr) ?? null;
  }, [selectedDate, schedules]);

  const queryClient = useQueryClient();

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) return;
    if (!confirm('Deseja realmente remover esta escala? 🌸')) return;

    try {
      const { error } = await supabase.from('schedules').delete().eq('id', selectedSchedule.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      setSelectedDate(new Date(selectedDate!)); // Force refresh locally
      toast.success('Escala removida com carinho ✨');
    } catch (error) {
      toast.error('Erro ao remover escala');
    }
  };

  const scheduleMap = useMemo(() => {
    const map = new Map<string, any>();
    schedules.forEach((s: any) => map.set(s.date, s));
    return map;
  }, [schedules]);

  const monthStats = useMemo(() => {
    const memberCounts = new Map<string, number>();
    schedules.forEach((s: any) => {
      s.schedule_members?.forEach((sm: any) => {
        const name = sm.members?.name ?? 'Desconhecida';
        memberCounts.set(name, (memberCounts.get(name) ?? 0) + 1);
      });
    });
    const memberIds = new Set<string>();
    schedules.forEach((s: any) => {
      s.schedule_members?.forEach((sm: any) => memberIds.add(sm.member_id));
    });
    return { participants: memberIds.size, totalSchedules: schedules.length, memberCounts };
  }, [schedules]);

  const dayOfWeekStart = getDay(start);

  return (
    <div className="space-y-8">
      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="glass-card border-0 overflow-hidden group hover:shadow-rose transition-shadow duration-300">
            <div className="h-1 w-full gradient-rose" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarDays className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{monthStats.totalSchedules}</p>
                <p className="text-xs text-muted-foreground font-medium">Escalas em {MONTHS[month]}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-0 overflow-hidden group hover:shadow-rose transition-shadow duration-300">
            <div className="h-1 w-full" style={{ background: 'var(--gradient-lilac)' }} />
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{monthStats.participants}</p>
                <p className="text-xs text-muted-foreground font-medium">Ministras ativas</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-0 overflow-hidden group hover:shadow-rose transition-shadow duration-300 cursor-pointer"
            onClick={() => setEscalaOpen(true)}
          >
            <div className="h-1 w-full bg-gradient-to-r from-primary/60 to-accent/60" />
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Resumo do mês</p>
                <p className="text-xs text-muted-foreground font-medium">Clique para ver detalhes</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="glass-card border-0 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10" onClick={() => setCurrentDate(d => subMonths(d, 1))}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-foreground">{MONTHS[month]}</h3>
                  <p className="text-xs text-muted-foreground">{year}</p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10" onClick={() => setCurrentDate(d => addMonths(d, 1))}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-7 gap-1 text-center mb-3">
                {WEEKDAYS.map(d => (
                  <div key={d} className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: dayOfWeekStart }).map((_, i) => <div key={`e-${i}`} />)}
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const daySchedule = scheduleMap.get(dateStr);
                  const hasSchedule = !!daySchedule;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const today = isToday(day);
                  const dayNum = getDay(day);


                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        relative rounded-xl p-1 text-sm font-medium transition-all duration-200 hover:scale-105 aspect-square flex flex-col items-center justify-center gap-0.5
                        ${isSelected ? 'gradient-rose text-white shadow-rose scale-105' : ''}
                        ${!isSelected && today ? 'ring-2 ring-primary/40 text-primary font-bold' : ''}
                        ${!isSelected && !today && hasSchedule ? 'bg-primary/15 text-primary font-semibold' : ''}
                        ${!isSelected && !today && !hasSchedule ? 'hover:bg-muted text-foreground/80' : ''}
                      `}
                    >
                      {day.getDate()}
                      {hasSchedule && (
                        <span className={`text-[8px] leading-none font-bold uppercase ${isSelected ? 'text-white/80' : 'text-primary/70'}`}>
                          {daySchedule.type === 'culto' ? '⛪' : '🎵'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Selected day details */}
        <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-0 h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl text-foreground">
                    {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
                    {selectedSchedule && (
                      <span className="ml-2 inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary capitalize">
                        {selectedSchedule.type === 'culto' ? <Church className="h-3.5 w-3.5" /> : <Music className="h-3.5 w-3.5" />}
                        {selectedSchedule.type}
                      </span>
                    )}
                  </CardTitle>
                  {selectedDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedSchedule ? 'Escala registrada' : 'Sem escala para este dia'}
                    </p>
                  )}
                </div>
                {isAdmin && selectedDate && (
                  <div className="flex items-center gap-2">
                    {selectedSchedule && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={handleDeleteSchedule}
                        title="Remover escala do dia"
                        aria-label="Remover escala"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="rounded-xl gradient-rose text-white border-0 shadow-rose hover:opacity-90 transition-opacity"
                      onClick={() => setEditOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {selectedSchedule ? 'Editar' : 'Criar'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {selectedSchedule ? (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/8">
                      {selectedSchedule.type === 'culto' ? <Church className="h-5 w-5 text-primary" /> : <Music className="h-5 w-5 text-accent" />}
                      <span className="capitalize font-bold text-foreground">{selectedSchedule.type}</span>
                    </div>

                    {selectedSchedule.schedule_outfits?.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                          <Shirt className="h-3.5 w-3.5" /> Fardamentos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSchedule.schedule_outfits.map((so: any) => (
                            <span key={so.id} className="bg-primary/12 text-primary text-sm font-semibold px-3.5 py-1.5 rounded-full">
                              {so.outfits?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSchedule.hair_style && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                        <Scissors className="h-5 w-5 text-accent/70" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Cabelo</p>
                          <p className="font-semibold text-foreground">{selectedSchedule.hair_style}</p>
                        </div>
                      </div>
                    )}

                    {selectedSchedule.schedule_members?.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                          <Users className="h-3.5 w-3.5" /> Ministras
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSchedule.schedule_members.map((sm: any) => (
                            <span key={sm.id} className="bg-primary/12 text-primary text-sm font-semibold px-3.5 py-1.5 rounded-full">
                              {sm.members?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSchedule.schedule_accessories?.length > 0 && (
                      <div className="space-y-2.5">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5" /> Acessórios
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSchedule.schedule_accessories.map((sa: any) => (
                            <span key={sa.id} className="bg-accent/15 text-accent-foreground text-sm font-semibold px-3.5 py-1.5 rounded-full">
                              {sa.accessories?.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSchedule.notes && (
                      <div className="p-4 rounded-xl bg-muted/50 border border-border/30">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Notas</p>
                        <p className="text-sm text-foreground/80">{selectedSchedule.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ) : selectedDate ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                      <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                    <p className="text-muted-foreground text-sm">Nenhuma escala para esta data ✨</p>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 rounded-xl"
                        onClick={() => setEditOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Criar escala
                      </Button>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-selection"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                      <span className="text-3xl">🪷</span>
                    </div>
                    <p className="text-muted-foreground text-sm">Selecione uma data no calendário 💖</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {selectedDate && (
        <ScheduleEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          date={selectedDate}
          schedule={selectedSchedule}
          members={members}
          outfits={outfits}
          accessories={accessories}
          onSave={() => { refetchSchedules(); setEditOpen(false); }}
        />
      )}

      {/* Resumo do mês Dialog */}
      <Dialog open={escalaOpen} onOpenChange={setEscalaOpen}>
        <DialogContent className="max-w-md rounded-2xl border-0 glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Resumo do mês — {MONTHS[month]} {year}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-accent/10">
              <span className="text-sm font-medium">Ministras que dançaram</span>
              <span className="text-lg font-bold text-accent">{monthStats.participants}</span>
            </div>
            {monthStats.memberCounts.size > 0 && (
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Participações por ministra</p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {Array.from(monthStats.memberCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                        <span className="text-sm">{name}</span>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{count}x</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScheduleEditDialog({ open, onOpenChange, date, schedule, members, outfits, accessories, onSave }: any) {
  const DEFAULT_TYPES = ['Culto de Celebração', 'Culto RCE', 'Congresso', 'Conferência', 'Aniversário Da Igreja'];
  const [type, setType] = useState(DEFAULT_TYPES[0].toLowerCase());
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [selectedOutfits, setSelectedOutfits] = useState<string[]>([]);
  const [hairStyle, setHairStyle] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const CUSTOM_TYPES_KEY = 'manancial_custom_event_types';

  // Load custom types from localStorage (persistent, independent from schedules)
  const [customTypes, setCustomTypes] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_TYPES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveCustomTypes = (list: string[]) => {
    setCustomTypes(list);
    try { localStorage.setItem(CUSTOM_TYPES_KEY, JSON.stringify(list)); } catch {}
  };

  // Merge default types with custom types (no duplicates)
  const allTypes = useMemo(() => {
    const defaultLower = DEFAULT_TYPES.map(t => t.toLowerCase());
    const extras = customTypes.filter(t => !defaultLower.includes(t.toLowerCase()));
    const result: { label: string; deletable: boolean }[] = DEFAULT_TYPES.map(t => ({ label: t, deletable: false }));
    extras.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    extras.forEach(t => {
      result.push({ label: t.charAt(0).toUpperCase() + t.slice(1), deletable: true });
    });
    return result;
  }, [customTypes]);

  useEffect(() => {
    if (open) {
      setShowCustomInput(false);
      setCustomTypeInput('');
      if (schedule) {
        setType(schedule.type ?? 'culto');
        setSelectedOutfits(schedule.schedule_outfits?.map((so: any) => so.outfit_id) ?? []);
        setHairStyle(schedule.hair_style ?? '');
        setNotes(schedule.notes ?? '');
        setSelectedMembers(schedule.schedule_members?.map((sm: any) => sm.member_id) ?? []);
        setSelectedAccessories(schedule.schedule_accessories?.map((sa: any) => sa.accessory_id) ?? []);
      } else {
        setType(DEFAULT_TYPES[0].toLowerCase());
        setSelectedOutfits([]);
        setHairStyle('');
        setNotes('');
        setSelectedMembers([]);
        setSelectedAccessories([]);
      }
    }
  }, [open, schedule]);

  const queryClient = useQueryClient();

  const handleAddCustomType = () => {
    const trimmed = customTypeInput.trim();
    if (trimmed) {
      const defaultLower = DEFAULT_TYPES.map(t => t.toLowerCase());
      const existsInDefaults = defaultLower.includes(trimmed.toLowerCase());
      const existsInCustom = customTypes.some(t => t.toLowerCase() === trimmed.toLowerCase());
      if (!existsInDefaults && !existsInCustom) {
        saveCustomTypes([...customTypes, trimmed]);
      }
      setType(trimmed.toLowerCase());
      setCustomTypeInput('');
      setShowCustomInput(false);
    }
  };

  const handleDeleteType = (typeLabel: string) => {
    const typeLower = typeLabel.toLowerCase();
    // Remove only from the custom list — does NOT touch existing schedules
    saveCustomTypes(customTypes.filter(t => t.toLowerCase() !== typeLower));
    if (type.toLowerCase() === typeLower) {
      setType(DEFAULT_TYPES[0].toLowerCase());
    }
    toast.success(`Tipo "${typeLabel}" removido da lista ✨`);
  };

  const handleSave = async () => {
    if (!type.trim()) {
      toast.error('Digite o tipo do evento');
      return;
    }
    setSaving(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      let scheduleId = schedule?.id;

      if (schedule) {
        await supabase.from('schedules').update({
          type: type.trim(), hair_style: hairStyle || null, notes: notes || null,
        }).eq('id', schedule.id);
      } else {
        const { data } = await supabase.from('schedules').insert({
          date: dateStr, type: type.trim(), hair_style: hairStyle || null, notes: notes || null,
        }).select().single();
        scheduleId = data?.id;
      }

      if (scheduleId) {
        await supabase.from('schedule_members').delete().eq('schedule_id', scheduleId);
        if (selectedMembers.length > 0) {
          await supabase.from('schedule_members').insert(
            selectedMembers.map(mid => ({ schedule_id: scheduleId, member_id: mid }))
          );
        }
        await supabase.from('schedule_accessories').delete().eq('schedule_id', scheduleId);
        if (selectedAccessories.length > 0) {
          await supabase.from('schedule_accessories').insert(
            selectedAccessories.map(aid => ({ schedule_id: scheduleId, accessory_id: aid }))
          );
        }
        await supabase.from('schedule_outfits').delete().eq('schedule_id', scheduleId);
        if (selectedOutfits.length > 0) {
          await supabase.from('schedule_outfits').insert(
            selectedOutfits.map(oid => ({ schedule_id: scheduleId, outfit_id: oid }))
          );
        }
      }

      toast.success('Escala salva com carinho ✨');
      onSave();
    } catch (error: any) {
      console.error('Erro ao salvar escala:', error);
      toast.error(`Erro ao salvar a escala: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (id: string) => setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  const toggleAccessory = (id: string) => setSelectedAccessories(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  const toggleOutfit = (id: string) => setSelectedOutfits(prev => prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]);

  // Sort alphabetically
  const sortedOutfits = [...outfits].sort((a: any, b: any) => a.name.localeCompare(b.name));
  const sortedMembers = [...members].sort((a: any, b: any) => a.name.localeCompare(b.name));
  const sortedAccessories = [...accessories].sort((a: any, b: any) => a.name.localeCompare(b.name));

  // Check if current type matches any button
  const isCustomType = !allTypes.some(t => t.label.toLowerCase() === type.toLowerCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border-0 glass-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {schedule ? 'Editar Escala' : 'Nova Escala'} — {format(date, "d 'de' MMMM", { locale: ptBR })} ({type.charAt(0).toUpperCase() + type.slice(1)})
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Type */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Tipo do Evento</label>
            <div className="flex flex-wrap gap-2">
              {allTypes.map(t => (
                <div key={t.label} className="relative group/type inline-flex">
                  <button
                    type="button"
                    onClick={() => { setType(t.label.toLowerCase()); setShowCustomInput(false); }}
                    className={`px-3.5 py-1.5 text-sm rounded-full font-medium transition-all ${
                      type.toLowerCase() === t.label.toLowerCase() ? 'gradient-rose text-white shadow-sm' : 'bg-muted/50 text-foreground/60 hover:bg-muted'
                    } ${t.deletable ? 'pr-7' : ''}`}
                  >
                    {t.label}
                  </button>
                  {t.deletable && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteType(t.label); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                      title={`Remover ${t.label}`}
                      aria-label={`Remover ${t.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {/* Show the current custom type as a selected button if it's not in the list */}
              {isCustomType && type.trim() && (
                <button
                  type="button"
                  className="px-3.5 py-1.5 text-sm rounded-full font-medium transition-all gradient-rose text-white shadow-sm"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )}
              {/* Button to add a new custom type - always fixed */}
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className={`px-3.5 py-1.5 text-sm rounded-full font-medium transition-all border-2 border-dashed ${
                  showCustomInput ? 'border-primary text-primary bg-primary/10' : 'border-muted-foreground/30 text-muted-foreground hover:border-primary/50 hover:text-primary/70'
                }`}
              >
                <Plus className="h-3.5 w-3.5 inline mr-1" />
                Novo tipo
              </button>
            </div>
            {/* Custom type input */}
            <AnimatePresence>
              {showCustomInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={customTypeInput}
                      onChange={e => setCustomTypeInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomType(); } }}
                      placeholder="Digite o nome do evento..."
                      className="rounded-xl bg-muted/30 border-border/40 flex-1"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomType}
                      disabled={!customTypeInput.trim()}
                      className="rounded-xl gradient-rose text-white border-0 px-4"
                    >
                      Usar
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Fardamentos - multi select A-Z */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
              <Shirt className="h-3.5 w-3.5" /> Fardamentos
            </label>
            <div className="flex flex-wrap gap-2">
              {sortedOutfits.map((o: any) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggleOutfit(o.id)}
                  className={`px-3.5 py-1.5 text-sm rounded-full font-medium transition-all ${
                    selectedOutfits.includes(o.id)
                      ? 'gradient-rose text-white shadow-sm'
                      : 'bg-muted/50 text-foreground/60 hover:bg-muted'
                  }`}
                >
                  {o.name}
                </button>
              ))}
            </div>
          </div>

          {/* Hair */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5" /> Cabelo
            </label>
            <Input
              value={hairStyle}
              onChange={e => setHairStyle(e.target.value)}
              placeholder="Ex: preso, solto, trança..."
              className="rounded-xl bg-muted/30 border-border/40"
            />
          </div>

          {/* Members A-Z */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Ministras
            </label>
            <div className="flex flex-wrap gap-2">
              {sortedMembers.map((m: any) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`px-3.5 py-1.5 text-sm rounded-full font-medium transition-all ${
                    selectedMembers.includes(m.id)
                      ? 'gradient-rose text-white shadow-sm'
                      : 'bg-muted/50 text-foreground/60 hover:bg-muted'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Accessories A-Z */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Acessórios
            </label>
            <div className="flex flex-wrap gap-2">
              {sortedAccessories.map((a: any) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAccessory(a.id)}
                  className={`px-3.5 py-1.5 text-sm rounded-full font-medium transition-all ${
                    selectedAccessories.includes(a.id)
                      ? 'bg-accent text-white shadow-sm'
                      : 'bg-muted/50 text-foreground/60 hover:bg-muted'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Notas</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Observações sobre o dia..."
              className="rounded-xl bg-muted/30 border-border/40 min-h-[80px]"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !type.trim()}
            className="w-full h-12 rounded-xl gradient-rose text-white font-semibold text-base shadow-rose hover:opacity-90 transition-opacity border-0"
          >
            {saving ? 'Salvando...' : 'Salvar escala 💖'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

