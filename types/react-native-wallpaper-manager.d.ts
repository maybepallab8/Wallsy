declare module '@ajaybhatia/react-native-wallpaper-manager' {
  interface WallpaperOptions {
    uri: string;
    screen: 'lock' | 'home' | 'both';
  }

  export default class WallPaperManager {
    static setWallpaper(options: WallpaperOptions, callback: (response: any) => void): void;
  }
} 