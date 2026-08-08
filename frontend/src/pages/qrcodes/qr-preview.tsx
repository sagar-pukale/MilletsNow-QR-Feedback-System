import { cn } from '@/lib/utils'
export function QRPreview({ token, size = 'sm' }: { token: string; size?: 'sm' | 'lg' }) {
  const cells = Array.from({ length: 81 }, (_, index) => ((index * 17 + token.length * 11) % 7) < 3 || index % 9 === 0)
  const finder = (x: number, y: number) => <><rect x={x} y={y} width="21" height="21" rx="1" fill="white" /><rect x={x + 3} y={y + 3} width="15" height="15" rx="1" fill="#151015" /><rect x={x + 7} y={y + 7} width="7" height="7" rx="1" fill="white" /></>
  return <div className={cn('rounded-xl border border-border/70 bg-white p-2 shadow-xs', size === 'lg' ? 'w-56' : 'w-14')}><svg viewBox="0 0 63 63" className="block w-full" role="img" aria-label={`QR preview for ${token}`}><rect width="63" height="63" fill="white" />{finder(2, 2)}{finder(40, 2)}{finder(2, 40)}{cells.map((filled, index) => filled ? <rect key={index} x={23 + (index % 9) * 4} y={23 + Math.floor(index / 9) * 4} width="3" height="3" fill="#151015" /> : null)}</svg></div>
}
