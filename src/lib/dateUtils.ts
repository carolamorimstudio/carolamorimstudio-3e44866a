import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data do banco de dados (formato YYYY-MM-DD) para exibição
 * sem problemas de timezone. SEMPRE trata a data como local.
 */
export function formatDateFromDB(dateString: string): string {
  if (!dateString) return '';
  
  // Remove qualquer informação de hora se existir (ex: "2024-03-15T00:00:00")
  const dateOnly = dateString.split('T')[0];
  
  // Parse manual para evitar timezone UTC
  const [year, month, day] = dateOnly.split('-').map(Number);
  
  // Cria data local (sem conversão UTC)
  const localDate = new Date(year, month - 1, day);
  
  return format(localDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/**
 * Formata uma data curta (dd/MM/yyyy)
 * DIRETO da string, sem usar Date() para evitar conversões de timezone
 * NUNCA muda o dia selecionado
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  
  // Remove qualquer informação de hora ou timezone se existir
  const dateOnly = dateString.split('T')[0].trim();
  
  // Parse direto da string - apenas string manipulation, sem Date()
  const parts = dateOnly.split('-');
  
  if (parts.length !== 3) {
    return dateString;
  }
  
  const [year, month, day] = parts;
  
  // Validação básica
  if (!year || !month || !day || year.length !== 4) {
    return dateString;
  }
  
  // Retorna formatação direta - 100% string manipulation
  // YYYY-MM-DD -> DD/MM/YYYY
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}
