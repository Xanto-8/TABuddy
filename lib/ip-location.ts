import { NextRequest } from 'next/server'
import { getClientIP } from './auth-guard'

export interface IPLocation {
  ip: string
  country: string
  region: string
  city: string
}

const countryNames: Record<string, string> = {
  CN: '中国',
  NL: '荷兰',
  US: '美国',
  JP: '日本',
  KR: '韩国',
  GB: '英国',
  DE: '德国',
  FR: '法国',
  CA: '加拿大',
  AU: '澳大利亚',
  SG: '新加坡',
  HK: '中国香港',
  TW: '中国台湾',
  MO: '中国澳门',
  MY: '马来西亚',
  TH: '泰国',
  VN: '越南',
  IN: '印度',
  RU: '俄罗斯',
  IT: '意大利',
  ES: '西班牙',
  PT: '葡萄牙',
  SE: '瑞典',
  NO: '挪威',
  FI: '芬兰',
  DK: '丹麦',
  CH: '瑞士',
  AT: '奥地利',
  BE: '比利时',
  IE: '爱尔兰',
  NZ: '新西兰',
}

const regionNames: Record<string, Record<string, string>> = {
  CN: {
    GD: '广东',
    BJ: '北京',
    SH: '上海',
    ZJ: '浙江',
    JS: '江苏',
    SD: '山东',
    SC: '四川',
    Hubei: '湖北',
    HN: '湖南',
    FJ: '福建',
    SN: '陕西',
    LN: '辽宁',
    HLJ: '黑龙江',
    JL: '吉林',
    HE: '河北',
    HA: '河南',
    AH: '安徽',
    JX: '江西',
    GX: '广西',
    GS: '甘肃',
    QH: '青海',
    XZ: '西藏',
    YN: '云南',
    GZ: '贵州',
    NX: '宁夏',
    NM: '内蒙古',
    XJ: '新疆',
    CQ: '重庆',
    TJ: '天津',
    HI: '海南',
    SX: '山西',
  },
  NL: {
    NH: '北荷兰省',
    ZH: '南荷兰省',
    NB: '北布拉班特省',
    GE: '海尔德兰省',
    UT: '乌得勒支省',
    FL: '弗莱福兰省',
    FR: '弗里斯兰省',
    GR: '格罗宁根省',
    DR: '德伦特省',
    OV: '上艾瑟尔省',
    LI: '林堡省',
    ZE: '泽兰省',
  },
}

function getCountryName(code: string): string {
  return countryNames[code] || code
}

function getRegionName(countryCode: string, regionCode: string): string {
  if (!regionCode) return ''
  const regions = regionNames[countryCode]
  if (regions) return regions[regionCode] || regionCode
  return regionCode
}

function isPrivateIP(ip: string): boolean {
  return !ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' ||
    ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')
}

export async function getLocationFromRequest(request: NextRequest): Promise<IPLocation> {
  const vercelIP = (request as any).ip
  const vercelGeo = (request as any).geo

  if (vercelIP && vercelGeo && vercelGeo.country) {
    return {
      ip: vercelIP,
      country: getCountryName(vercelGeo.country),
      region: getRegionName(vercelGeo.country, vercelGeo.region),
      city: vercelGeo.city || '',
    }
  }

  const ip = getClientIP(request)

  if (isPrivateIP(ip) || !ip) {
    return { ip, country: '', region: '', city: '' }
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`, {
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.status === 'success') {
        return {
          ip,
          country: data.country || '',
          region: data.regionName || '',
          city: data.city || '',
        }
      }
    }
  } catch {
  }

  return { ip, country: '', region: '', city: '' }
}

export function formatLocation(loc: IPLocation): string {
  const parts: string[] = []
  if (loc.country) parts.push(loc.country)
  if (loc.region && loc.country === '中国' ? !loc.city || loc.city === loc.region : true) {
    if (loc.region !== loc.city) parts.push(loc.region)
  }
  if (loc.city && loc.city !== loc.region) parts.push(loc.city)
  return parts.join(' ') || '未知'
}
