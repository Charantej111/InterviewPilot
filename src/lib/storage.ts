export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(`interviewpilot_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`interviewpilot_${key}`, JSON.stringify(value));
    } catch {
      // Storage failure graceful handling
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(`interviewpilot_${key}`);
    } catch {
      // Ignore
    }
  },
};
