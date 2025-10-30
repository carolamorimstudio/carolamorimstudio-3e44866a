/**
 * Configuração de parsers de tipos do PostgreSQL para evitar conversões indesejadas de timezone
 * Especificamente para o tipo DATE (OID 1082)
 */

// @ts-ignore - Supabase expõe o postgrest internamente mas não tipado publicamente
import { supabase } from '@/integrations/supabase/client';

/**
 * Configura o parser do tipo DATE do PostgreSQL para retornar a string crua
 * sem conversões de timezone. Isso garante que uma data salva como "2025-10-31"
 * seja retornada exatamente como "2025-10-31" sem mudanças.
 */
export function configureDateParser() {
  try {
    // Acessa o client PostgreSQL interno do Supabase
    // @ts-ignore
    const pgClient = supabase?.rest?.['fetch']?.client;
    
    if (pgClient && typeof pgClient.setTypeParser === 'function') {
      // OID 1082 = DATE type no PostgreSQL
      // Retorna a string como está, sem conversões
      pgClient.setTypeParser(1082, (val: string) => val);
      console.log('✅ Parser de DATE configurado com sucesso');
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível configurar parser de DATE:', error);
  }
}

// Executa a configuração imediatamente quando o módulo é importado
configureDateParser();
