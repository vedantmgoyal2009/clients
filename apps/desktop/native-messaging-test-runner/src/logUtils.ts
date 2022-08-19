/* eslint-disable no-console */

// Class for logging messages with colors for ease of readin important info
export class LogUtils {
  static logSuccess(message: string, payload?: any): void {
    if (payload) {
      console.log(`\x1b[32m ${message} \x1b[0m`, payload);
    } else {
      console.log(`\x1b[32m ${message} \x1b[0m`);
    }
  }

  static logWarning(message: string, payload?: any): void {
    if (payload) {
      console.log(`\x1b[33m ${message} \x1b[0m`, payload);
    } else {
      console.log(`\x1b[33m ${message} \x1b[0m`);
    }
  }

  static logError(message: string, payload?: any): void {
    if (payload) {
      console.log(`\x1b[31m ${message} \x1b[0m`, payload);
    } else {
      console.log(`\x1b[31m ${message} \x1b[0m`);
    }
  }
}
