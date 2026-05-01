export interface IPLocation {
  city: string
  region: string
  country: string
}

export async function getIPLocation(ip: string): Promise<IPLocation | null> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return null
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success') return null
    return {
      city: data.city || '',
      region: data.regionName || '',
      country: data.country || '',
    }
  } catch {
    return null
  }
}

export function formatLocation(loc: IPLocation | null): string {
  if (!loc) return ''
  const parts: string[] = []
  if (loc.country && loc.country !== '中国') parts.push(loc.country)
  if (loc.region) parts.push(loc.region)
  if (loc.city && loc.city !== loc.region) parts.push(loc.city)
  return parts.join(' ') || '未知位置'
}
