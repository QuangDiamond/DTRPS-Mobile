/* eslint-disable @typescript-eslint/no-require-imports */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Không theo dõi thư mục build native (Gradle/CMake): trên Windows CMake tạo đường dẫn lạ trong
// `.cxx` khiến Metro sập ("UNKNOWN: unknown error, lstat …_CMakeLTOTest-CXX…").
const escape = (p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nativeBuildDirs = [
  new RegExp(`^${escape(path.join(__dirname, 'android'))}[\\\\/].*`),
  new RegExp(`^${escape(path.join(__dirname, 'ios'))}[\\\\/].*`),
  /[\\/]android[\\/](build|\.cxx|\.gradle)[\\/].*/,
  /[\\/]\.cxx[\\/].*/,
];
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  ...nativeBuildDirs,
];

module.exports = withNativeWind(config, {
  input: './global.css',
});
