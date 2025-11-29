import { getConfirmationUI } from '../utils/paymentConfirmationLogic';

export function runPaymentConfirmationLogicTests() {
  const t1 = getConfirmationUI(false, false);
  console.assert(t1.bannerTitle === 'Aguardando Confirmação!', 'T1 bannerTitle');
  console.assert(t1.showTimer === true, 'T1 showTimer');
  console.assert(t1.reservedLabel === 'Reservado', 'T1 reservedLabel');
  console.assert(t1.showInstructions === true, 'T1 showInstructions');

  const t2 = getConfirmationUI(true, false);
  console.assert(t2.bannerTitle === 'Compra confirmada', 'T2 bannerTitle');
  console.assert(t2.bannerSubtitle.includes('liberados'), 'T2 bannerSubtitle');
  console.assert(t2.showTimer === false, 'T2 showTimer');
  console.assert(t2.reservedLabel === 'Compra confirmada', 'T2 reservedLabel');
  console.assert(t2.showInstructions === false, 'T2 showInstructions');

  const t3 = getConfirmationUI(false, true);
  console.assert(t3.bannerTitle === 'Aguardando Confirmação!', 'T3 bannerTitle');
  console.assert(t3.showTimer === true, 'T3 showTimer');
}

