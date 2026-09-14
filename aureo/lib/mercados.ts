/** Catalogo de mercados que sigue la app. Todos cotizan en Yahoo Finance. */
export type Grupo = 'indices' | 'cripto' | 'forex' | 'materias'

export interface Simbolo {
  id: string
  symbol: string
  nombre: string
  grupo: Grupo
  /** Decimales al pintar: el yen o una cripto barata necesitan mas. */
  decimales?: number
  icono?: string
  color: string
}

export const SIMBOLOS: Simbolo[] = [
  // Indices
  { id: 'sp500',    symbol: '^GSPC',     nombre: 'S&P 500',        grupo: 'indices', color: '#6C2BD9' },
  { id: 'nasdaq',   symbol: '^IXIC',     nombre: 'Nasdaq',         grupo: 'indices', color: '#0EA5E9' },
  { id: 'nasdaq100',symbol: '^NDX',      nombre: 'Nasdaq 100',     grupo: 'indices', color: '#3B82F6' },
  { id: 'ibex',     symbol: '^IBEX',     nombre: 'IBEX 35',        grupo: 'indices', color: '#F59E0B' },
  { id: 'eurostoxx',symbol: '^STOXX50E', nombre: 'Euro Stoxx 50',  grupo: 'indices', color: '#8B5CF6' },

  // Cripto, en euros para no obligar a convertir mentalmente
  { id: 'btc',  symbol: 'BTC-EUR', nombre: 'Bitcoin',  grupo: 'cripto', color: '#F7931A' },
  { id: 'eth',  symbol: 'ETH-EUR', nombre: 'Ethereum', grupo: 'cripto', color: '#627EEA' },
  { id: 'sol',  symbol: 'SOL-EUR', nombre: 'Solana',   grupo: 'cripto', color: '#14F195', decimales: 2 },
  { id: 'xrp',  symbol: 'XRP-EUR', nombre: 'XRP',      grupo: 'cripto', color: '#23292F', decimales: 4 },
  { id: 'ada',  symbol: 'ADA-EUR', nombre: 'Cardano',  grupo: 'cripto', color: '#0033AD', decimales: 4 },

  // Divisas: cuanto vale un euro en cada moneda
  { id: 'eurusd', symbol: 'EURUSD=X', nombre: 'EUR / USD', grupo: 'forex', color: '#22C55E', decimales: 4 },
  { id: 'eurgbp', symbol: 'EURGBP=X', nombre: 'EUR / GBP', grupo: 'forex', color: '#EC4899', decimales: 4 },
  { id: 'eurjpy', symbol: 'EURJPY=X', nombre: 'EUR / JPY', grupo: 'forex', color: '#EF4444', decimales: 2 },
  { id: 'eurchf', symbol: 'EURCHF=X', nombre: 'EUR / CHF', grupo: 'forex', color: '#14B8A6', decimales: 4 },

  // Materias primas
  { id: 'oro',      symbol: 'GC=F', nombre: 'Oro',      grupo: 'materias', color: '#EAB308' },
  { id: 'petroleo', symbol: 'CL=F', nombre: 'Petróleo', grupo: 'materias', color: '#64748B' },
]

export const GRUPOS: { id: Grupo; nombre: string }[] = [
  { id: 'indices',  nombre: 'Índices' },
  { id: 'cripto',   nombre: 'Cripto' },
  { id: 'forex',    nombre: 'Divisas' },
  { id: 'materias', nombre: 'Materias' },
]

export interface Cotizacion {
  id: string
  symbol: string
  nombre: string
  grupo: Grupo
  currency: string
  price: number
  previous: number
  changePct: number
  marketState: string
  decimales: number
  color: string
  /** Cierres de los ultimos dias para pintar la linea de tendencia. */
  serie: number[]
  /** De donde sale el precio: Yahoo por defecto, Finnhub si Yahoo falla. */
  fuente?: 'yahoo' | 'finnhub'
}

/** Formatea segun la magnitud: 68.330 EUR y 0,1832 EUR piden decimales distintos. */
export function formatearPrecio(c: Pick<Cotizacion, 'price' | 'currency' | 'decimales'>): string {
  const moneda = c.currency === 'EUR' ? 'EUR' : c.currency === 'USD' ? 'USD' : c.currency
  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: moneda,
      minimumFractionDigits: c.decimales,
      maximumFractionDigits: c.decimales,
    }).format(c.price)
  } catch {
    return `${c.price.toFixed(c.decimales)} ${moneda}`
  }
}

/**
 * Simbolos equivalentes en Finnhub, la reserva cuando Yahoo no responde.
 * Solo equivalentes exactos: un activo sin equivalente no se sustituye por uno
 * parecido (un ETF en lugar de un indice). Mejor un hueco que un precio que no
 * es el que dice ser.
 */
export const FINNHUB: Record<string, { symbol: string; currency: string }> = {
  sp500:     { symbol: '^GSPC',           currency: 'USD' },
  nasdaq:    { symbol: '^IXIC',           currency: 'USD' },
  nasdaq100: { symbol: '^NDX',            currency: 'USD' },
  ibex:      { symbol: '^IBEX',           currency: 'EUR' },
  eurostoxx: { symbol: '^STOXX50E',       currency: 'EUR' },
  btc:       { symbol: 'BINANCE:BTCEUR',  currency: 'EUR' },
  eth:       { symbol: 'BINANCE:ETHEUR',  currency: 'EUR' },
  sol:       { symbol: 'BINANCE:SOLEUR',  currency: 'EUR' },
  xrp:       { symbol: 'BINANCE:XRPEUR',  currency: 'EUR' },
  ada:       { symbol: 'BINANCE:ADAEUR',  currency: 'EUR' },
  eurusd:    { symbol: 'OANDA:EUR_USD',   currency: 'USD' },
  eurgbp:    { symbol: 'OANDA:EUR_GBP',   currency: 'GBP' },
  eurjpy:    { symbol: 'OANDA:EUR_JPY',   currency: 'JPY' },
  eurchf:    { symbol: 'OANDA:EUR_CHF',   currency: 'CHF' },
  oro:       { symbol: 'OANDA:XAU_USD',   currency: 'USD' },
  petroleo:  { symbol: 'OANDA:WTICO_USD', currency: 'USD' },
}

/** Respuesta de GET /quote de Finnhub: `c` precio actual, `pc` cierre anterior. */
export interface CotizacionFinnhub {
  c?: number
  pc?: number
  t?: number
}

/**
 * Convierte una cotizacion de Finnhub al formato de la app. Finnhub responde
 * con ceros cuando un simbolo no entra en el plan contratado: eso es "sin
 * dato", nunca un precio de cero.
 */
export function desdeFinnhub(s: Simbolo, q: CotizacionFinnhub | null | undefined): Cotizacion | null {
  const destino = FINNHUB[s.id]
  const price = Number(q?.c)
  const previous = Number(q?.pc)
  if (!destino || !Number.isFinite(price) || price <= 0 || !Number.isFinite(previous) || previous <= 0) return null
  return {
    id: s.id,
    symbol: s.symbol,
    nombre: s.nombre,
    grupo: s.grupo,
    currency: destino.currency,
    price,
    previous,
    changePct: ((price - previous) / previous) * 100,
    marketState: 'UNKNOWN',
    decimales: s.decimales ?? 2,
    color: s.color,
    // La cotizacion de Finnhub no trae historico: la linea une el cierre anterior con el precio actual.
    serie: [previous, price],
    fuente: 'finnhub',
  }
}
