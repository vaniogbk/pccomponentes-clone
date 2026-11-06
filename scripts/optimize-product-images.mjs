import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDirectory = path.resolve('apps/web/public/images/products');
const outputDirectory = path.join(sourceDirectory, 'optimized');
const imageSources = new Map([
  ['rtx-5090', 'NVIDIA_GeForce_RTX_5090_CARTON.png'],
  ['rtx-5080', 'NVIDIA_GeForce_RTX_5080_CARTON.png'],
  ['rx-9070-xt', 'AMD_Radeon_RX_9070_XT_CARTON.png'],
  ['ryzen-7-9800x3d', 'AMD_Ryzen_7_9800X3D_CARTON.png'],
  ['core-ultra-7-270k-plus', 'Intel_Core_Ultra_7_270K_Plus_CARTON.png'],
  ['playstation-5', 'Sony_PlayStation_5_CARTON.png'],
  ['switch-2', 'Nintendo_Switch_2_CARTON.png'],
  ['xbox-series-x', 'Microsoft_Xbox_Series_X_CARTON.png'],
  ['xbox-series-s', 'Microsoft_Xbox_Series_S_CARTON.png'],
  ['rog-swift-oled-pg34wcdn', 'ASUS_ROG_Swift_OLED_PG34WCDN_CARTON.png'],
  ['huntsman-v3-pro-tkl', 'Razer_Huntsman_V3_Pro_TKL_CARTON.png'],
  ['pro-x-superlight-2', 'Logitech_G_Pro_X_Superlight_2_CARTON.png'],
  ['arctis-nova-pro-wireless', 'SteelSeries_Arctis_Nova_Pro_Wireless_CARTON.png'],
  ['titan-evo', 'Secretlab_TITAN_Evo_CARTON.png'],
  ['samsung-9100-pro', 'Samsung_9100_PRO_CARTON.png'],
  ['dominator-titanium-ddr5-7200', 'Corsair_Dominator_Titanium_DDR5-7200_CARTON.png'],
]);

const sourceFiles = await fs.readdir(sourceDirectory);
const expectedFiles = new Set(imageSources.values());
const missingFiles = [...expectedFiles].filter((file) => !sourceFiles.includes(file));
const unexpectedFiles = sourceFiles.filter(
  (file) => file.toLowerCase().endsWith('.png') && !expectedFiles.has(file),
);

if (missingFiles.length > 0 || unexpectedFiles.length > 0) {
  throw new Error([
    missingFiles.length > 0 && `Images source manquantes : ${missingFiles.join(', ')}.`,
    unexpectedFiles.length > 0 && `Images source sans produit associé : ${unexpectedFiles.join(', ')}.`,
  ].filter(Boolean).join(' '));
}

await fs.mkdir(outputDirectory, { recursive: true });

const results = await Promise.all([...imageSources].map(async ([id, fileName]) => {
  const source = path.join(sourceDirectory, fileName);
  const destination = path.join(outputDirectory, `${id}.webp`);
  const metadata = await sharp(source).metadata();

  if (metadata.format !== 'png' || !metadata.width || !metadata.height) {
    throw new Error(`Format ou dimensions invalides pour ${fileName}.`);
  }

  const output = await sharp(source)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toFile(destination);

  return { id, width: output.width, height: output.height, bytes: output.size };
}));

console.info(`Images optimisées : ${results.length} fichiers WebP.`);
console.info(`Taille totale : ${Math.round(results.reduce((total, image) => total + image.bytes, 0) / 1024)} Ko.`);
