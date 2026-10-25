export type AssetCardVariant = 'compact' | 'standard' | 'detailed';

export interface AssetCardConfig {
  readonly variant: AssetCardVariant;
  readonly showPrice: boolean;
  readonly showUnlockAction: boolean;
  readonly showPreviewButton: boolean;
}

export const DEFAULT_ASSET_CARD_CONFIG: AssetCardConfig = {
  variant: 'standard',
  showPrice: true,
  showUnlockAction: true,
  showPreviewButton: true,
};
