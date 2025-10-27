import pLimit from 'p-limit';

static async getCampaignTicketsStatus(
  campaignId: string,
  userId?: string
): Promise<{ data: TicketStatusInfo[] | null; error: any }> {
  try {
    // 1️⃣ Buscar total_tickets da campanha
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('total_tickets')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw campaignError;
    if (!campaign?.total_tickets) {
      throw new Error('Campanha não encontrada ou sem total_tickets definido.');
    }

    const totalTickets = campaign.total_tickets;
    const PAGE_SIZE = 1000;
    const totalPages = Math.ceil(totalTickets / PAGE_SIZE);

    // 2️⃣ Criar limitador de concorrência (máx. 5 requisições simultâneas)
    const limit = pLimit(5);
    const promises: Promise<any>[] = [];

    for (let i = 0; i < totalPages; i++) {
      const offset = i * PAGE_SIZE;
      promises.push(
        limit(() =>
          supabase.rpc('get_campaign_tickets_status', {
            p_campaign_id: campaignId,
            p_offset: offset,
            p_limit: PAGE_SIZE,
            p_user_id: userId || null,
          })
        )
      );
    }

    // 3️⃣ Executar todas as requisições em paralelo com limite
    const results = await Promise.all(promises);

    // 4️⃣ Verificar se houve algum erro
    const errorResult = results.find((r) => r.error);
    if (errorResult?.error) throw errorResult.error;

    // 5️⃣ Combinar todos os dados
    const allTickets = results.flatMap((r) => r.data || []);

    return { data: allTickets, error: null };
  } catch (error: any) {
    console.error('Erro ao buscar status dos tickets:', error);
    return { data: null, error };
  }
}
