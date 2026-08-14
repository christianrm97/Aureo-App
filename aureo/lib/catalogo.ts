/**
 * Catalogo de plataformas y suministros.
 *
 * `icono` es el slug de simple-icons (CC0). Las marcas que ese paquete no
 * incluye — Disney+, Amazon, Microsoft, Adobe, LinkedIn y las electricas
 * espanolas — van con `icono: null` y se pintan con monograma sobre su color.
 */
export interface Plataforma {
  id: string
  nombre: string
  icono: string | null
  color: string
  categoria: 'video' | 'musica' | 'gaming' | 'software' | 'formacion' | 'deporte' | 'otros'
  planes: { nombre: string; precio: number }[]
}

export const PLATAFORMAS: Plataforma[] = [
  // Video
  { id: 'netflix', nombre: 'Netflix', icono: 'netflix', color: '#E50914', categoria: 'video',
    planes: [{ nombre: 'Estándar con anuncios', precio: 6.99 }, { nombre: 'Estándar', precio: 13.99 }, { nombre: 'Premium', precio: 19.99 }] },
  { id: 'disneyplus', nombre: 'Disney+', icono: null, color: '#113CCF', categoria: 'video',
    planes: [{ nombre: 'Estándar con anuncios', precio: 5.99 }, { nombre: 'Estándar', precio: 9.99 }, { nombre: 'Premium', precio: 13.99 }] },
  { id: 'primevideo', nombre: 'Prime Video', icono: null, color: '#00A8E1', categoria: 'video',
    planes: [{ nombre: 'Amazon Prime', precio: 4.99 }, { nombre: 'Anual (prorrateado)', precio: 4.17 }] },
  { id: 'hbomax', nombre: 'HBO Max', icono: 'hbo', color: '#8A2BE2', categoria: 'video',
    planes: [{ nombre: 'Básico con anuncios', precio: 5.99 }, { nombre: 'Estándar', precio: 9.99 }, { nombre: 'Premium', precio: 13.99 }] },
  { id: 'appletv', nombre: 'Apple TV+', icono: 'appletv', color: '#000000', categoria: 'video',
    planes: [{ nombre: 'Mensual', precio: 9.99 }] },
  { id: 'dazn', nombre: 'DAZN', icono: 'dazn', color: '#0BF63C', categoria: 'video',
    planes: [{ nombre: 'Total', precio: 34.99 }, { nombre: 'Fútbol', precio: 19.99 }] },
  { id: 'crunchyroll', nombre: 'Crunchyroll', icono: 'crunchyroll', color: '#F47521', categoria: 'video',
    planes: [{ nombre: 'Fan', precio: 5.99 }, { nombre: 'Mega Fan', precio: 7.99 }] },
  { id: 'filmin', nombre: 'Filmin', icono: null, color: '#FF4B4B', categoria: 'video',
    planes: [{ nombre: 'Mensual', precio: 8.99 }] },
  { id: 'movistarplus', nombre: 'Movistar Plus+', icono: 'movistar', color: '#019DF4', categoria: 'video',
    planes: [{ nombre: 'Básico', precio: 9.99 }, { nombre: 'Fútbol', precio: 29.99 }] },

  // Musica y audio
  { id: 'spotify', nombre: 'Spotify', icono: 'spotify', color: '#1DB954', categoria: 'musica',
    planes: [{ nombre: 'Individual', precio: 10.99 }, { nombre: 'Dúo', precio: 14.99 }, { nombre: 'Familiar', precio: 17.99 }] },
  { id: 'applemusic', nombre: 'Apple Music', icono: 'applemusic', color: '#FA243C', categoria: 'musica',
    planes: [{ nombre: 'Individual', precio: 10.99 }, { nombre: 'Familiar', precio: 16.99 }] },
  { id: 'youtubepremium', nombre: 'YouTube Premium', icono: 'youtube', color: '#FF0000', categoria: 'musica',
    planes: [{ nombre: 'Individual', precio: 11.99 }, { nombre: 'Familiar', precio: 23.99 }] },
  { id: 'audible', nombre: 'Audible', icono: 'audible', color: '#F8991C', categoria: 'musica',
    planes: [{ nombre: 'Premium Plus', precio: 9.99 }] },

  // Gaming
  { id: 'playstationplus', nombre: 'PlayStation Plus', icono: 'playstation', color: '#0070D1', categoria: 'gaming',
    planes: [{ nombre: 'Essential', precio: 6.99 }, { nombre: 'Extra', precio: 10.99 }, { nombre: 'Premium', precio: 13.99 }] },
  { id: 'xbox', nombre: 'Xbox Game Pass', icono: null, color: '#107C10', categoria: 'gaming',
    planes: [{ nombre: 'Core', precio: 6.99 }, { nombre: 'Ultimate', precio: 14.99 }] },
  { id: 'nintendo', nombre: 'Nintendo Switch Online', icono: null, color: '#E60012', categoria: 'gaming',
    planes: [{ nombre: 'Individual', precio: 1.66 }, { nombre: 'Expansión', precio: 3.25 }] },
  { id: 'twitch', nombre: 'Twitch', icono: 'twitch', color: '#9146FF', categoria: 'gaming',
    planes: [{ nombre: 'Suscripción Tier 1', precio: 4.99 }] },

  // Software y productividad
  { id: 'icloud', nombre: 'iCloud+', icono: 'icloud', color: '#3693F3', categoria: 'software',
    planes: [{ nombre: '50 GB', precio: 0.99 }, { nombre: '200 GB', precio: 2.99 }, { nombre: '2 TB', precio: 9.99 }] },
  { id: 'googleone', nombre: 'Google One', icono: 'google', color: '#4285F4', categoria: 'software',
    planes: [{ nombre: '100 GB', precio: 1.99 }, { nombre: '200 GB', precio: 2.99 }, { nombre: '2 TB', precio: 9.99 }] },
  { id: 'microsoft365', nombre: 'Microsoft 365', icono: null, color: '#D83B01', categoria: 'software',
    planes: [{ nombre: 'Personal', precio: 7.00 }, { nombre: 'Familia', precio: 10.00 }] },
  { id: 'adobe', nombre: 'Adobe Creative Cloud', icono: null, color: '#FF0000', categoria: 'software',
    planes: [{ nombre: 'Fotografía', precio: 12.09 }, { nombre: 'Todas las apps', precio: 66.53 }] },
  { id: 'canva', nombre: 'Canva', icono: null, color: '#00C4CC', categoria: 'software',
    planes: [{ nombre: 'Pro', precio: 11.99 }] },
  { id: 'notion', nombre: 'Notion', icono: 'notion', color: '#000000', categoria: 'software',
    planes: [{ nombre: 'Plus', precio: 9.50 }] },
  { id: 'chatgpt', nombre: 'ChatGPT', icono: null, color: '#10A37F', categoria: 'software',
    planes: [{ nombre: 'Plus', precio: 23.00 }, { nombre: 'Pro', precio: 229.00 }] },
  { id: 'claude', nombre: 'Claude', icono: 'claude', color: '#D97757', categoria: 'software',
    planes: [{ nombre: 'Pro', precio: 18.00 }, { nombre: 'Max', precio: 90.00 }] },
  { id: 'github', nombre: 'GitHub', icono: 'github', color: '#181717', categoria: 'software',
    planes: [{ nombre: 'Pro', precio: 3.67 }, { nombre: 'Copilot', precio: 9.20 }] },
  { id: 'dropbox', nombre: 'Dropbox', icono: 'dropbox', color: '#0061FF', categoria: 'software',
    planes: [{ nombre: 'Plus', precio: 11.99 }] },

  // Formacion y deporte
  { id: 'duolingo', nombre: 'Duolingo', icono: 'duolingo', color: '#58CC02', categoria: 'formacion',
    planes: [{ nombre: 'Super', precio: 12.99 }] },
  { id: 'strava', nombre: 'Strava', icono: 'strava', color: '#FC4C02', categoria: 'deporte',
    planes: [{ nombre: 'Premium', precio: 8.99 }] },
  { id: 'gimnasio', nombre: 'Gimnasio', icono: null, color: '#6C2BD9', categoria: 'deporte',
    planes: [{ nombre: 'Cuota mensual', precio: 29.99 }] },

  // Comida a domicilio
  { id: 'glovo', nombre: 'Glovo Prime', icono: 'glovo', color: '#FFC244', categoria: 'otros',
    planes: [{ nombre: 'Prime', precio: 5.99 }] },
  { id: 'ubereats', nombre: 'Uber One', icono: 'ubereats', color: '#06C167', categoria: 'otros',
    planes: [{ nombre: 'Uber One', precio: 5.99 }] },
  { id: 'otra', nombre: 'Otra plataforma', icono: null, color: '#9A93A8', categoria: 'otros',
    planes: [{ nombre: 'Cuota mensual', precio: 0 }] },
]

/** Suministros y recibos domiciliados: no son plataformas, son gasto corriente. */
export interface TipoRecibo {
  id: string
  nombre: string
  icono: string
  color: string
  bg: string
  /** Referencia orientativa de gasto mensual en Espana, solo para el placeholder. */
  tipico: number
}

export const TIPOS_RECIBO: TipoRecibo[] = [
  { id: 'luz',      nombre: 'Luz',        icono: 'zap',        color: '#F59E0B', bg: '#FEF3C7', tipico: 65 },
  { id: 'agua',     nombre: 'Agua',       icono: 'droplet',    color: '#3B82F6', bg: '#DBEAFE', tipico: 25 },
  { id: 'gas',      nombre: 'Gas',        icono: 'flame',      color: '#EF4444', bg: '#FEE2E2', tipico: 40 },
  { id: 'internet', nombre: 'Internet',   icono: 'wifi',       color: '#8B5CF6', bg: '#EDE4FE', tipico: 35 },
  { id: 'movil',    nombre: 'Móvil',      icono: 'smartphone', color: '#14B8A6', bg: '#CCFBF1', tipico: 15 },
  { id: 'ibi',      nombre: 'IBI',        icono: 'landmark',   color: '#6C2BD9', bg: '#EFE7FB', tipico: 30 },
  { id: 'basuras',  nombre: 'Basuras',    icono: 'trash',      color: '#6B647A', bg: '#ECE7F1', tipico: 8 },
  { id: 'comunidad',nombre: 'Comunidad',  icono: 'building',   color: '#EC4899', bg: '#FCE7F3', tipico: 45 },
  { id: 'seguro',   nombre: 'Seguro',     icono: 'shield',     color: '#22C55E', bg: '#DCFCE7', tipico: 30 },
  { id: 'otro',     nombre: 'Otro',       icono: 'receipt',    color: '#9A93A8', bg: '#ECE7F1', tipico: 0 },
]

/** Tipos de deuda. `revolving` marca las que no tienen fin conocido. */
export interface TipoDeuda {
  id: string
  nombre: string
  icono: string
  color: string
  bg: string
  revolving: boolean
}

export const TIPOS_DEUDA: TipoDeuda[] = [
  { id: 'prestamo',    nombre: 'Préstamo personal', icono: 'banknote',   color: '#6C2BD9', bg: '#EFE7FB', revolving: false },
  { id: 'hipoteca',    nombre: 'Hipoteca',          icono: 'home',       color: '#3B82F6', bg: '#DBEAFE', revolving: false },
  { id: 'financiacion',nombre: 'Financiación',      icono: 'creditcard', color: '#F59E0B', bg: '#FEF3C7', revolving: false },
  { id: 'tarjeta',     nombre: 'Tarjeta de crédito',icono: 'creditcard', color: '#EF4444', bg: '#FEE2E2', revolving: true },
  { id: 'aplazado',    nombre: 'Pago aplazado',     icono: 'calendar',   color: '#EC4899', bg: '#FCE7F3', revolving: false },
  { id: 'familiar',    nombre: 'Préstamo familiar', icono: 'users',      color: '#14B8A6', bg: '#CCFBF1', revolving: false },
]

export const plataformaDe = (id: string) => PLATAFORMAS.find((p) => p.id === id) ?? PLATAFORMAS[PLATAFORMAS.length - 1]
export const tipoReciboDe = (id: string) => TIPOS_RECIBO.find((t) => t.id === id) ?? TIPOS_RECIBO[TIPOS_RECIBO.length - 1]
export const tipoDeudaDe = (id: string) => TIPOS_DEUDA.find((t) => t.id === id) ?? TIPOS_DEUDA[0]
