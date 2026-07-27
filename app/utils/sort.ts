/**
 * 依 rank 表（code → 序號）產生比較器：rank 越小越前；無 rank 的項目以 Infinity
 * 排到最後並維持原始（穩定）順序。rank 為 undefined（order.json 缺失）時整體退回原順序。
 *
 * key 取出項目用來查 rank 的代碼字串：
 *   - 物件清單：byRank(rank, (o) => o.value)
 *   - 純代碼字串清單：byRank(rank, (c) => c)
 */
export function byRank<T>(
  rank: Record<string, number> | undefined,
  key: (item: T) => string,
) {
  return (a: T, b: T) =>
    (rank?.[key(a)] ?? Infinity) - (rank?.[key(b)] ?? Infinity)
}
