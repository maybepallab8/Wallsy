declare module 'react-native-manage-wallpaper' {
  export const TYPE: {
    HOME: string;
    LOCK: string;
    BOTH: string;
  };

  export interface WallpaperOptions {
    uri: string;
  }

  export interface WallpaperResponse {
    status: string;
    msg: string;
    url: string;
  }

  export default class ManageWallpaper {
    static setWallpaper(
      source: WallpaperOptions,
      callback: (response: WallpaperResponse) => void,
      type: string
    ): void;
  }
} 