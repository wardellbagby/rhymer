export interface UiConfig {
  showDownload: boolean;
  showOpen: boolean;
}

export type UiConfigProvider = () => UiConfig;
