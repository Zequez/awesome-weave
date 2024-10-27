export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ghUrl(path: string) {
  return `https://github.com/${path.replace(/^\//, "")}`;
}
