import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

export async function exportAllDataToExcel() {
  const [
    { data: members },
    { data: outfits },
    { data: accessories },
    { data: schedules },
    { data: scheduleMembers },
    { data: scheduleAccessories },
    { data: scheduleOutfits },
  ] = await Promise.all([
    supabase.from('members').select('*').order('name'),
    supabase.from('outfits').select('*').order('name'),
    supabase.from('accessories').select('*').order('name'),
    supabase.from('schedules').select('*').order('date', { ascending: true }),
    supabase.from('schedule_members').select('*, members(name)'),
    supabase.from('schedule_accessories').select('*, accessories(name)'),
    supabase.from('schedule_outfits').select('*, outfits(name)'),
  ]);

  const wb = XLSX.utils.book_new();

  // --- Calendar sheets per year ---
  const allSchedules = schedules || [];
  const yearsSet = new Set(allSchedules.map((s: any) => s.date.slice(0, 4)));
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  for (const yr of Array.from(yearsSet).sort()) {
    const yearSchedules = allSchedules.filter((s: any) => s.date.startsWith(yr));
    const rows: any[][] = [];

    for (let month = 0; month < 12; month++) {
      const monthSchedules = yearSchedules.filter((s: any) => {
        const d = new Date(s.date + 'T12:00:00');
        return d.getMonth() === month;
      });
      if (monthSchedules.length === 0) continue;

      rows.push([`📅 ${MONTHS[month]} ${yr}`]);
      rows.push(['Data', 'Dia', 'Tipo', 'Fardamentos', 'Cabelo', 'Ministras', 'Acessórios', 'Notas']);

      for (const s of monthSchedules) {
        const d = new Date(s.date + 'T12:00:00');
        const dayName = WEEKDAYS[d.getDay()];
        const dateStr = d.toLocaleDateString('pt-BR');

        const sOutfits = (scheduleOutfits || [])
          .filter((so: any) => so.schedule_id === s.id)
          .map((so: any) => (so.outfits as any)?.name || '')
          .filter(Boolean)
          .join(', ');

        const sMembers = (scheduleMembers || [])
          .filter((sm: any) => sm.schedule_id === s.id)
          .map((sm: any) => (sm.members as any)?.name || '')
          .filter(Boolean)
          .join(', ');

        const sAccessories = (scheduleAccessories || [])
          .filter((sa: any) => sa.schedule_id === s.id)
          .map((sa: any) => (sa.accessories as any)?.name || '')
          .filter(Boolean)
          .join(', ');

        rows.push([dateStr, dayName, s.type, sOutfits, s.hair_style || '', sMembers, sAccessories, s.notes || '']);
      }
      rows.push([]);
    }

    if (rows.length > 0) {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [
        { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 25 },
        { wch: 15 }, { wch: 35 }, { wch: 25 }, { wch: 30 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, `Escalas ${yr}`);
    }
  }

  // --- Members sheet ---
  const membersData = (members || []).map((m: any) => ({
    Nome: m.name, Status: m.status, Observações: m.notes || '',
    'Criado em': new Date(m.created_at).toLocaleDateString('pt-BR'),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membersData), 'Membros');

  // --- Outfits sheet ---
  const outfitsData = (outfits || []).map((o: any) => ({
    Nome: o.name, Descrição: o.description || '',
    'Criado em': new Date(o.created_at).toLocaleDateString('pt-BR'),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(outfitsData), 'Fardamentos');

  // --- Accessories sheet ---
  const accessoriesData = (accessories || []).map((a: any) => ({
    Nome: a.name, Descrição: a.description || '',
    'Criado em': new Date(a.created_at).toLocaleDateString('pt-BR'),
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(accessoriesData), 'Acessórios');

  XLSX.writeFile(wb, `Escala_Manancial_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
