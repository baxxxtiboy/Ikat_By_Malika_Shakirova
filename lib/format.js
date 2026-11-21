export function som(n) {
  const v = Math.round(Number(n) || 0);
  return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
}

export const STATUSES = {
  new: 'Yangi',
  confirmed: 'Tasdiqlandi',
  shipped: "Yo'lda",
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
};
