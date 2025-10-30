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

export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  
  console.log('🔍 formatDateShort recebeu:', JSON.stringify(dateString));
  
  // Remove qualquer informação de hora se existir (ex: "2024-03-15T00:00:00")
  const dateOnly = dateString.split('T')[0];
  console.log('📅 Após split T:', dateOnly);
  
  // Parse manual para evitar timezone UTC
  const parts = dateOnly.split('-');
  console.log('📊 Parts:', parts);
  
  if (parts.length !== 3) return dateString;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  console.log('🔢 Parseado: ano=', year, 'mês=', month, 'dia=', day);
  
  // Verifica se os valores são válidos
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return dateString;
  }
  
  // Retorna formatação direta sem usar Date() para evitar qualquer conversão de timezone
  const dayStr = day.toString().padStart(2, '0');
  const monthStr = month.toString().padStart(2, '0');
  
  const resultado = `${dayStr}/${monthStr}/${year}`;
  console.log('✅ Resultado final:', resultado);
  
  return resultado;
}
