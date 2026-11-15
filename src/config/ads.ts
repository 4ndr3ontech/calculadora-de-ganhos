export interface AdsConfig {
  enabled: boolean;
  publisherId: string; // Ex: pub-xxxxxxxxxxxxxxxx
}

export const ADS_CONFIG: AdsConfig = {
  enabled: false, // Mantido falso até a aprovação oficial do AdSense
  publisherId: 'pub-0000000000000000',
};