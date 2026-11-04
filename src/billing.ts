import { asaasOffer } from './asaas';

export function pixMonthPriceCents(code?: string) {
  return code ? asaasOffer(code)?.pix ?? null : null;
}
