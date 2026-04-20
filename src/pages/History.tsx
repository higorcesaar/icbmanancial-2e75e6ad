import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Church, Music, CalendarDays, Shirt, Users, Sparkles, Scissors, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { exportAllDataToExcel } from '@/lib/exportToExcel';
import { toast } from 'sonner';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function History() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(String(currentYear));
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const { data: schedules = [] } = useQuery({
    queryKey: ['history', year],
    queryFn: async () => {
      const { data } = await supabase
        .from('schedules')
        .select('*, schedule_outfits(*, outfits(*)), schedule_members(*, members(*)), schedule_accessories(*, accessories(*))')
        .gte('date', `${year}-01-01`)
        .lte('date', `${year}-12-31`)
        .order('date');
      return data ?? [];
    },
  });

  const byMonth = MONTHS.map((name, i) => ({
    name,
    index: i,
    schedules: schedules.filter((s: any) => parseISO(s.date).getMonth() === i),
  }));

  const activeMonth = selectedMonth !== null ? byMonth[selectedMonth] : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Histórico</h2>
          <p className="text-sm text-muted-foreground mt-1">Registro de todas as escalas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={async () => {
              try {
                await exportAllDataToExcel();
                toast.success('Planilha exportada! 📊');
              } catch {
                toast.error('Erro ao exportar');
              }
            }}
          >
            <Download className="h-4 w-4 mr-1" /> Exportar Excel
          </Button>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28 rounded-xl bg-card border-border/40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {byMonth.map((m, idx) => (
          <motion.div key={m.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
            <Card
              className={`glass-card border-0 overflow-hidden cursor-pointer group hover:shadow-rose transition-all duration-300 ${m.schedules.length === 0 ? 'opacity-50' : ''}`}
              onClick={() => m.schedules.length > 0 && setSelectedMonth(m.index)}
            >
              <div className="h-1 w-full gradient-rose" />
              <CardContent className="p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-primary/15 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <p className="font-bold text-foreground text-sm">{m.name}</p>
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {m.schedules.length} escala{m.schedules.length !== 1 ? 's' : ''}
                </span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {byMonth.every(m => m.schedules.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
            <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <p className="text-muted-foreground text-sm">Nenhuma escala registrada em {year} ✨</p>
        </div>
      )}

      {/* Month detail dialog */}
      <Dialog open={selectedMonth !== null} onOpenChange={(open) => !open && setSelectedMonth(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {activeMonth && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {activeMonth.name} {year} — {activeMonth.schedules.length} escala{activeMonth.schedules.length !== 1 ? 's' : ''}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-3">
                {activeMonth.schedules.map((s: any) => (
                  <Card key={s.id} className="border-0 bg-muted/30 rounded-xl overflow-hidden">
                    <div className="h-0.5 w-full gradient-rose" />
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        {s.type === 'culto' ? <Church className="h-4 w-4 text-primary" /> : <Music className="h-4 w-4 text-accent" />}
                        <span className="font-bold text-sm capitalize text-foreground">{s.type}</span>
                        <span className="text-xs text-muted-foreground">— {format(parseISO(s.date), "d 'de' MMMM", { locale: ptBR })}</span>
                      </div>

                      {s.schedule_outfits?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <Shirt className="h-3 w-3" /> Fardamentos
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.schedule_outfits.map((so: any) => (
                              <span key={so.id} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">{so.outfits?.name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.hair_style && (
                        <div className="flex items-center gap-2">
                          <Scissors className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs"><span className="text-muted-foreground font-semibold">Cabelo:</span> {s.hair_style}</p>
                        </div>
                      )}

                      {s.schedule_members?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <Users className="h-3 w-3" /> Ministras
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.schedule_members.map((sm: any) => (
                              <span key={sm.id} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-0.5 rounded-full">{sm.members?.name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.schedule_accessories?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3" /> Acessórios
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.schedule_accessories.map((sa: any) => (
                              <span key={sa.id} className="text-xs bg-accent/12 text-accent-foreground font-semibold px-2.5 py-0.5 rounded-full">{sa.accessories?.name}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.notes && <p className="text-xs text-muted-foreground italic">📝 {s.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
