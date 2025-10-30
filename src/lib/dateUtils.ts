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
  if (!dateString) {
    console.warn('⚠️ formatDateShort: string vazia recebida');
    return '';
  }
  
  console.log('🔍 formatDateShort INÍCIO:', {
    input: dateString,
    tipo: typeof dateString,
    length: dateString.length
  });
  
  // Remove qualquer informação de hora se existir
  const dateOnly = dateString.split('T')[0];
  console.log('📅 Após remover hora:', dateOnly);
  
  // Parse direto da string - SEM parseInt, SEM Number, apenas string manipulation
  const [year, month, day] = dateOnly.split('-');
  
  console.log('📊 Partes da data:', { year, month, day });
  
  if (!year || !month || !day) {
    console.error('❌ Partes inválidas!');
    return dateString;
  }
  
  // Retorna formatação direta - 100% string manipulation
  const resultado = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  console.log('✅ formatDateShort RESULTADO:', resultado);
  
  return resultado;
}
