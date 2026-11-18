import { ParsedAppointment } from '../types';

export function parseAppointmentMessage(
  content: string,
  appointmentStatuses: Record<string, string>
): ParsedAppointment | null {
  if (!content.startsWith('[LỊCH HẸN XEM XE]')) return null;
  const parts = content.split('#');
  let id = '';
  let time = '';
  let date = '';
  let location = '';
  let note = '';

  parts.forEach((p) => {
    if (p.startsWith('ID:')) id = p.replace('ID:', '');
    else if (p.startsWith('TIME:')) time = p.replace('TIME:', '');
    else if (p.startsWith('DATE:')) date = p.replace('DATE:', '');
    else if (p.startsWith('LOC:')) location = p.replace('LOC:', '');
    else if (p.startsWith('NOTE:')) note = p.replace('NOTE:', '');
  });

  const status = (appointmentStatuses[id] as any) || 'PENDING';
  return { id, time, date, location, note, status };
}
