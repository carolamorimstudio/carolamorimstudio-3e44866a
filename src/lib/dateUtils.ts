import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Converte uma data do input HTML (YYYY-MM-DD) para o formato que o banco aceita
 * GARANTINDO que seja interpretada como data local, sem conversão UTC
 */
export function prepareLocalDate(dateString: string): string {
  if (!dateString) return '';
  
  // O input type="date" já retorna no formato YYYY-MM-DD
  // Apenas garantimos que está no formato correto
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  
  const [year, month, day] = parts;
  
  // Retorna no formato exato que o Postgres date espera (YYYY-MM-DD)
  return `${year}-${month}-${day}`;
}

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
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  
  // Remove qualquer informação de hora se existir
  const dateOnly = dateString.split('T')[0];
  
  // Parse direto da string
  const parts = dateOnly.split('-');
  if (parts.length !== 3) return dateString;
  
  const [year, month, day] = parts;
  
  // Retorna formatação direta - SEM usar Date() para garantir dia exato
  return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
}
