export function decodeSseFrame(frame: string): Record<string, unknown> | null {
  const data = frame.split('\n').filter(line => line.startsWith('data:'))
    .map(line => line.slice(5).trimStart()).join('\n');
  if (!data) return null;
  try {
    const value = JSON.parse(data);
    return value && typeof value === 'object' && !Array.isArray(value) && typeof value.topic === 'string' ? value : null;
  } catch { return null; }
}
