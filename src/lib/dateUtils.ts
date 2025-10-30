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
 * SEMPRE trata a data como local para evitar diferença de um dia
 */
export function formatDateShort(dateString: string): string {
  if (!dateString) return '';
  
  console.log('🔄 formatDateShort recebeu:', dateString);
  
  // Remove qualquer informação de hora se existir (ex: "2024-03-15T00:00:00")
  const dateOnly = dateString.split('T')[0];
  console.log('📋 Data limpa:', dateOnly);
  
  // Parse manual para evitar timezone UTC
  const [year, month, day] = dateOnly.split('-').map(Number);
  console.log('🔢 Valores parseados:', { year, month, day });
  
  // Verifica se os valores são válidos
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    console.error('❌ Invalid date string:', dateString);
    return dateString;
  }
  
  // Cria data local (sem conversão UTC)
  const localDate = new Date(year, month - 1, day);
  console.log('📅 Data local criada:', localDate.toLocaleDateString('pt-BR'));
  
  const formatted = format(localDate, 'dd/MM/yyyy', { locale: ptBR });
  console.log('✨ Data formatada:', formatted);
  
  return formatted;
}
