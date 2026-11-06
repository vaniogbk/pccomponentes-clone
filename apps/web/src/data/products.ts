export interface Product {
  id: string;
  image: string;
  sku?: string;
  brand: string;
  name: string;
  category: 'Cartes Graphiques' | 'Processeurs' | 'Consoles' | 'Périphériques Gaming' | 'Stockage & Mémoire';
  shortSpecs: string;
  priceCents: number;
  dataStatus: 'DEMO' | 'VERIFIED';
}

export const PCCOMPONENTES_CATALOG: Product[] = [
  {
    id: 'rtx-5090',
    image: '/images/products/optimized/rtx-5090.webp',
    brand: 'NVIDIA',
    name: 'GeForce RTX 5090 32 Go GDDR7',
    category: 'Cartes Graphiques',
    shortSpecs: '32 Go GDDR7 · PCIe 5.0 · 512-bit · Blackwell',
    priceCents: 219990,
    dataStatus: 'DEMO',
  },
  {
    id: 'rtx-5080',
    image: '/images/products/optimized/rtx-5080.webp',
    brand: 'NVIDIA',
    name: 'GeForce RTX 5080 16 Go GDDR7',
    category: 'Cartes Graphiques',
    shortSpecs: '16 Go GDDR7 · PCIe 5.0 · 256-bit · DLSS 4',
    priceCents: 119990,
    dataStatus: 'DEMO',
  },
  {
    id: 'rx-9070-xt',
    image: '/images/products/optimized/rx-9070-xt.webp',
    brand: 'AMD',
    name: 'Radeon RX 9070 XT 16 Go GDDR6',
    category: 'Cartes Graphiques',
    shortSpecs: '16 Go GDDR6 · PCIe 5.0 · Architecture RDNA 4',
    priceCents: 74990,
    dataStatus: 'DEMO',
  },
  {
    id: 'ryzen-7-9800x3d',
    image: '/images/products/optimized/ryzen-7-9800x3d.webp',
    brand: 'AMD',
    name: 'AMD Ryzen 7 9800X3D (4.7 GHz / 5.2 GHz)',
    category: 'Processeurs',
    shortSpecs: '8 cœurs / 16 threads · Cache 104 Mo (3D V-Cache) · AM5',
    priceCents: 52990,
    dataStatus: 'DEMO'
  },
  {
    id: 'core-ultra-7-270k-plus',
    image: '/images/products/optimized/core-ultra-7-270k-plus.webp',
    brand: 'Intel',
    name: 'Intel Core Ultra 7 270K Plus',
    category: 'Processeurs',
    shortSpecs: '24 cœurs (8P + 16E) · LGA 1851 · Série 200S Plus',
    priceCents: 49990,
    dataStatus: 'DEMO'
  },
  {
    id: 'playstation-5',
    image: '/images/products/optimized/playstation-5.webp',
    brand: 'Sony',
    name: 'PlayStation 5 Édition France',
    category: 'Consoles',
    shortSpecs: 'Manette sans fil DualSense · Audio 3D Tempest',
    priceCents: 54990,
    dataStatus: 'DEMO'
  },
  {
    id: 'switch-2',
    image: '/images/products/optimized/switch-2.webp',
    brand: 'Nintendo',
    name: 'Nintendo Switch 2',
    category: 'Consoles',
    shortSpecs: 'Console hybride nouvelle génération',
    priceCents: 39990,
    dataStatus: 'DEMO'
  },
  {
    id: 'xbox-series-x',
    image: '/images/products/optimized/xbox-series-x.webp',
    brand: 'Microsoft',
    name: 'Xbox Series X 1 To',
    category: 'Consoles',
    shortSpecs: 'SSD NVMe 1 To · 4K 120 FPS · Lecteur Blu-ray 4K',
    priceCents: 54990,
    dataStatus: 'DEMO'
  },
  {
    id: 'xbox-series-s',
    image: '/images/products/optimized/xbox-series-s.webp',
    brand: 'Microsoft',
    name: 'Xbox Series S',
    category: 'Consoles',
    shortSpecs: '100% numérique · Jusqu’à 120 FPS',
    priceCents: 29990,
    dataStatus: 'DEMO'
  },
  {
    id: 'rog-swift-oled-pg34wcdn',
    image: '/images/products/optimized/rog-swift-oled-pg34wcdn.webp',
    sku: '90LM0CU0-B01971',
    brand: 'ASUS',
    name: 'ASUS ROG Swift OLED PG34WCDN 34" Incurvé',
    category: 'Périphériques Gaming',
    shortSpecs: '34" UWQHD 3440 × 1440 · 360 Hz · QD-OLED · 0.03 ms',
    priceCents: 129900,
    dataStatus: 'DEMO'
  },
  {
    id: 'huntsman-v3-pro-tkl',
    image: '/images/products/optimized/huntsman-v3-pro-tkl.webp',
    brand: 'Razer',
    name: 'Razer Huntsman V3 Pro TKL',
    category: 'Périphériques Gaming',
    shortSpecs: 'Clavier optique analogique Gen-2 · Rapid Trigger',
    priceCents: 24999,
    dataStatus: 'DEMO'
  },
  {
    id: 'pro-x-superlight-2',
    image: '/images/products/optimized/pro-x-superlight-2.webp',
    brand: 'Logitech G',
    name: 'Logitech G PRO X SUPERLIGHT 2',
    category: 'Périphériques Gaming',
    shortSpecs: 'Souris sans fil LIGHTSPEED · Capteur HERO 2 · 60 g',
    priceCents: 15900,
    dataStatus: 'DEMO'
  },
  {
    id: 'arctis-nova-pro-wireless',
    image: '/images/products/optimized/arctis-nova-pro-wireless.webp',
    brand: 'SteelSeries',
    name: 'SteelSeries Arctis Nova Pro Wireless',
    category: 'Périphériques Gaming',
    shortSpecs: 'Hi-Res Audio · Réduction active ANC · Double batterie interchangeable',
    priceCents: 36990,
    dataStatus: 'DEMO'
  },
  {
    id: 'titan-evo',
    image: '/images/products/optimized/titan-evo.webp',
    brand: 'Secretlab',
    name: 'Fauteuil Gaming Secretlab TITAN Evo',
    category: 'Périphériques Gaming',
    shortSpecs: 'Soutien lombaire 4D L-ADAPT · Finition hybride',
    priceCents: 54900,
    dataStatus: 'DEMO'
  },
  {
    id: 'samsung-9100-pro',
    image: '/images/products/optimized/samsung-9100-pro.webp',
    sku: 'MZ-VAP2T0BW',
    brand: 'Samsung',
    name: 'Samsung 9100 PRO SSD NVMe M.2 PCIe 5.0',
    category: 'Stockage & Mémoire',
    shortSpecs: 'PCIe Gen 5.0 x4 · Débits jusqu’à 14 000 Mo/s',
    priceCents: 26990,
    dataStatus: 'DEMO'
  },
  {
    id: 'dominator-titanium-ddr5-7200',
    image: '/images/products/optimized/dominator-titanium-ddr5-7200.webp',
    sku: 'CMP32GX5M2X7200C34',
    brand: 'Corsair',
    name: 'Corsair Dominator Titanium RGB DDR5-7200',
    category: 'Stockage & Mémoire',
    shortSpecs: 'Kit haute fréquence · Intel XMP 3.0 / AMD EXPO',
    priceCents: 23990,
    dataStatus: 'DEMO'
  }
];
