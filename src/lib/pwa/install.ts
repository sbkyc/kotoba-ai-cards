export type InstallPlatform = "ios" | "android" | "desktop";

export function getInstallPlatform(userAgent: string): InstallPlatform {
  const normalized = userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(normalized)) return "ios";
  if (normalized.includes("android")) return "android";
  return "desktop";
}

export function getInstallSteps(platform: InstallPlatform): string[] {
  if (platform === "ios") {
    return ["用 Safari 打开这个网址", "点底部分享按钮", "选择“添加到主屏幕”"];
  }

  if (platform === "android") {
    return ["用 Chrome 或 Edge 打开这个网址", "点菜单里的“安装应用”或“添加到主屏幕”", "确认后桌面会出现 Kotoba 图标"];
  }

  return ["点浏览器地址栏右侧的安装图标", "或打开浏览器菜单选择“安装 Kotoba”", "安装后可以像桌面软件一样启动"];
}

export function isStandaloneDisplay(matchesStandalone: boolean, navigatorStandalone: boolean): boolean {
  return matchesStandalone || navigatorStandalone;
}
