export type ConfirmationUI = {
  bannerTitle: string;
  bannerSubtitle: string;
  showTimer: boolean;
  reservedLabel: string;
  showInstructions: boolean;
};

export function getConfirmationUI(
  purchaseConfirmed: boolean,
  isExpired: boolean
): ConfirmationUI {
  if (purchaseConfirmed) {
    return {
      bannerTitle: 'Compra confirmada',
      bannerSubtitle: 'Pagamento aprovado e seus números foram liberados',
      showTimer: false,
      reservedLabel: 'Compra confirmada',
      showInstructions: false,
    };
  }

  if (isExpired) {
    return {
      bannerTitle: 'Aguardando Confirmação!',
      bannerSubtitle: 'Complete o pagamento',
      showTimer: true,
      reservedLabel: 'Reservado',
      showInstructions: true,
    };
  }

  return {
    bannerTitle: 'Aguardando Confirmação!',
    bannerSubtitle: 'Complete o pagamento',
    showTimer: true,
    reservedLabel: 'Reservado',
    showInstructions: true,
  };
}

