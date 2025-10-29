import { supabase } from '../lib/supabase';

export interface CustomerData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
}

/**
 * Verifica se um cliente já existe na tabela tickets pelo número de telefone
 * 
 * ✅ CORREÇÃO APLICADA: NÃO normaliza phoneNumber
 * O número JÁ CHEGA NORMALIZADO dos componentes de UI (ReservationStep1Modal)
 * Formato esperado: +5562999999999
 * 
 * A função RPC 'get_tickets_by_phone' do banco de dados já faz a normalização
 * interna para comparação, então não é necessário normalizar aqui.
 * 
 * @param phoneNumber - Número de telefone JÁ NORMALIZADO (formato: +5562999999999)
 * @returns Dados do cliente se encontrado, null caso contrário
 */
export async function checkCustomerByPhone(
  phoneNumber: string
): Promise<{ data: CustomerData | null; error: any }> {
  try {
    // ✅ CORREÇÃO: NÃO normaliza - usa exatamente como recebido
    console.log('🔵 customerCheck.checkCustomerByPhone - Input phone (NO normalization):', phoneNumber);
    
    // Usa a função do banco que normaliza números de telefone internamente
    const { data, error } = await supabase
      .rpc('get_tickets_by_phone', { 
        p_phone_number: phoneNumber // ✅ Usa diretamente, SEM normalizar
      });

    if (error) {
      console.error('❌ customerCheck - Error checking customer by phone:', error);
      return { data: null, error };
    }

    console.log(`🟢 customerCheck - Found ${data?.length || 0} tickets for phone:`, phoneNumber);

    // Retorna o primeiro resultado (mais recente)
    if (data && data.length > 0) {
      const firstTicket = data[0];
      
      const customerData: CustomerData = {
        customer_name: firstTicket.customer_name,
        customer_email: firstTicket.customer_email,
        customer_phone: firstTicket.customer_phone
      };

      console.log('✅ customerCheck - Customer found:', {
        name: customerData.customer_name,
        email: customerData.customer_email,
        phone: customerData.customer_phone
      });

      return {
        data: customerData,
        error: null
      };
    }

    console.log('ℹ️ customerCheck - No customer found for this phone');
    return { data: null, error: null };
  } catch (error) {
    console.error('❌ customerCheck - Unexpected error:', error);
    return { data: null, error };
  }
}