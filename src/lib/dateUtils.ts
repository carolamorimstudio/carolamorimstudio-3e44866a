import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data do banco de dados (formato YYYY-MM-DD) para exibição
 * sem problemas de timezone
 */
export function formatDateFromDB(dateString: string): string {
  if (!dateString) return '';
  
  // Se a data já está no formato correto (YYYY-MM-DD), manipule como string local
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  
  return format(localDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Formata uma data curta (dd/MM/yyyy)
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  
  return format(localDate, 'dd/MM/yyyy', { locale: ptBR });
}
