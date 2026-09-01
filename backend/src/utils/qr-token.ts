const qrTokenAliases = new Map<string, string>([
  ['MN-LAD0-00001', 'MN-LADO-00001'],
  ['MN-LADO-00001', 'MN-LAD0-00001'],
])

export function resolveQrTokenCandidates(token: string) {
  const normalized = token.trim().toUpperCase()
  if (!normalized) return []

  const candidates = [normalized]
  const alias = qrTokenAliases.get(normalized)
  if (alias && alias !== normalized) {
    candidates.push(alias)
  }

  return candidates
}
