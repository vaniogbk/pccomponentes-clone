export interface Product {
  id: string;
  sku?: string;
  brand: string;
  name: string;
  category: 'Cartes Graphiques' | 'Processeurs' | 'Consoles' | 'Périphériques Gaming' | 'Stockage & Mémoire';
  shortSpecs: string;
  price: number;
  badge?: string;
  status: 'CONFIRMÉE' | 'PROPOSITION À VALIDER';
  inStock: boolean;
  supplierNote?: string;
}

export const PCCOMPONENTES_CATALOG: Product[] = [
  {
    id: 'rtx-5090',
    brand: 'NVIDIA',
    name: 'GeForce RTX 5090 32 Go GDDR7',
    category: 'Cartes Graphiques',
    shortSpecs: '32 Go GDDR7 · PCIe 5.0 · 512-bit · Blackwell',
    price: 2199.90,
    badge: 'Nouveauté',
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser le modèle partenaire (ASUS, MSI, Gigabyte, etc.) ou Founders Edition.'
  },
  {
    id: 'rtx-5080',
    brand: 'NVIDIA',
    name: 'GeForce RTX 5080 16 Go GDDR7',
    category: 'Cartes Graphiques',
    shortSpecs: '16 Go GDDR7 · PCIe 5.0 · 256-bit · DLSS 4',
    price: 1199.90,
    badge: 'Nouveauté',
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser le modèle constructeur partenaire retenu.'
  },
  {
    id: 'rx-9070-xt',
    brand: 'AMD',
    name: 'Radeon RX 9070 XT 16 Go GDDR6',
    category: 'Cartes Graphiques',
    shortSpecs: '16 Go GDDR6 · PCIe 5.0 · Architecture RDNA 4',
    price: 749.90,
    badge: 'Nouveauté',
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Modèles partenaires uniquement (Sapphire, PowerColor, ASUS, XFX...).'
  },
  {
    id: 'ryzen-7-9800x3d',
    brand: 'AMD',
    name: 'AMD Ryzen 7 9800X3D (4.7 GHz / 5.2 GHz)',
    category: 'Processeurs',
    shortSpecs: '8 cœurs / 16 threads · Cache 104 Mo (3D V-Cache) · AM5',
    price: 529.90,
    badge: 'Top Ventes',
    status: 'CONFIRMÉE',
    inStock: true
  },
  {
    id: 'core-ultra-7-270k-plus',
    brand: 'Intel',
    name: 'Intel Core Ultra 7 270K Plus',
    category: 'Processeurs',
    shortSpecs: '24 cœurs (8P + 16E) · LGA 1851 · Série 200S Plus',
    price: 499.90,
    badge: 'Génération 2026',
    status: 'PROPOSITION À VALIDER',
    inStock: true,
    supplierNote: 'Remplace "Core Ultra Series 2". Compatible chipsets série 800.'
  },
  {
    id: 'playstation-5',
    brand: 'Sony',
    name: 'PlayStation 5 Édition France',
    category: 'Consoles',
    shortSpecs: 'Manette sans fil DualSense · Audio 3D Tempest',
    price: 549.90,
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Spécifier : Slim avec lecteur, Digital Edition 825 Go ou PS5 Pro.'
  },
  {
    id: 'switch-2',
    brand: 'Nintendo',
    name: 'Nintendo Switch 2',
    category: 'Consoles',
    shortSpecs: 'Console hybride nouvelle génération',
    price: 399.90,
    badge: 'Prochainement',
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Définir console seule ou bundle pack de lancement.'
  },
  {
    id: 'xbox-series-x',
    brand: 'Microsoft',
    name: 'Xbox Series X 1 To',
    category: 'Consoles',
    shortSpecs: 'SSD NVMe 1 To · 4K 120 FPS · Lecteur Blu-ray 4K',
    price: 549.90,
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser modèle avec lecteur (noir) ou Digital Edition (blanc).'
  },
  {
    id: 'xbox-series-s',
    brand: 'Microsoft',
    name: 'Xbox Series S',
    category: 'Consoles',
    shortSpecs: '100% numérique · Jusqu’à 120 FPS',
    price: 299.90,
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser 512 Go blanc ou 1 To noir.'
  },
  {
    id: 'rog-swift-oled-pg34wcdn',
    sku: '90LM0CU0-B01971',
    brand: 'ASUS',
    name: 'ASUS ROG Swift OLED PG34WCDN 34" Incurvé',
    category: 'Périphériques Gaming',
    shortSpecs: '34" UWQHD 3440 × 1440 · 360 Hz · QD-OLED · 0.03 ms',
    price: 1299.00,
    badge: 'OLED 360 Hz',
    status: 'PROPOSITION À VALIDER',
    inStock: true,
    supplierNote: 'Modèle 360 Hz ultra-large officiel validé chez ASUS.'
  },
  {
    id: 'huntsman-v3-pro-tkl',
    brand: 'Razer',
    name: 'Razer Huntsman V3 Pro TKL',
    category: 'Périphériques Gaming',
    shortSpecs: 'Clavier optique analogique Gen-2 · Rapid Trigger',
    price: 249.99,
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser déclinaison (Standard ou 8KHz) et couleur (Noir/Blanc).'
  },
  {
    id: 'pro-x-superlight-2',
    brand: 'Logitech G',
    name: 'Logitech G PRO X SUPERLIGHT 2',
    category: 'Périphériques Gaming',
    shortSpecs: 'Souris sans fil LIGHTSPEED · Capteur HERO 2 · 60 g',
    price: 159.00,
    badge: 'Esports',
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser la couleur : Noir, Blanc ou Magenta.'
  },
  {
    id: 'arctis-nova-pro-wireless',
    brand: 'SteelSeries',
    name: 'SteelSeries Arctis Nova Pro Wireless',
    category: 'Périphériques Gaming',
    shortSpecs: 'Hi-Res Audio · Réduction active ANC · Double batterie interchangeable',
    price: 369.90,
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser version PC/PlayStation ou Xbox.'
  },
  {
    id: 'titan-evo',
    brand: 'Secretlab',
    name: 'Fauteuil Gaming Secretlab TITAN Evo',
    category: 'Périphériques Gaming',
    shortSpecs: 'Soutien lombaire 4D L-ADAPT · Finition hybride',
    price: 549.00,
    status: 'PROPOSITION À VALIDER',
    inStock: true,
    supplierNote: 'Remplacement validé pour "TITAN Evo 2026". Définir la taille et le tissu.'
  },
  {
    id: 'samsung-9100-pro',
    sku: 'MZ-VAP2T0BW',
    brand: 'Samsung',
    name: 'Samsung 9100 PRO SSD NVMe M.2 PCIe 5.0',
    category: 'Stockage & Mémoire',
    shortSpecs: 'PCIe Gen 5.0 x4 · Débits jusqu’à 14 000 Mo/s',
    price: 269.90,
    badge: 'PCIe Gen5',
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser capacité (1 To, 2 To, 4 To, 8 To) et dissipateur.'
  },
  {
    id: 'dominator-titanium-ddr5-7200',
    sku: 'CMP32GX5M2X7200C34',
    brand: 'Corsair',
    name: 'Corsair Dominator Titanium RGB DDR5-7200',
    category: 'Stockage & Mémoire',
    shortSpecs: 'Kit haute fréquence · Intel XMP 3.0 / AMD EXPO',
    price: 239.90,
    status: 'CONFIRMÉE',
    inStock: true,
    supplierNote: 'Préciser le kit exact (32 Go CL34 ou 48 Go CL36).'
  }
];
