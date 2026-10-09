import { describe, expect, it, vi } from 'vitest';

// syncService pulls in the Firestore and Supabase clients, which need a
// configured app at import time. Only the pure helpers are under test here.
vi.mock('../services/api', () => ({ issuesAPI: {} }));
vi.mock('./supabaseImageUpload', () => ({ uploadImageToSupabase: vi.fn() }));

const { syncService } = await import('./syncService');

// 1x1 transparent PNG.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const PNG_DATA_URL = `data:image/png;base64,${PNG_BASE64}`;
const PNG_BYTES = Buffer.from(PNG_BASE64, 'base64').length;

describe('syncService.isBase64Image', () => {
  it('recognises data URLs', () => {
    expect(syncService.isBase64Image(PNG_DATA_URL)).toBe(true);
    expect(syncService.isBase64Image('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
  });

  it('recognises long raw base64 strings', () => {
    expect(syncService.isBase64Image('A'.repeat(101))).toBe(true);
  });

  it('rejects short strings, URLs and non-strings', () => {
    expect(syncService.isBase64Image(PNG_BASE64)).toBe(false); // under 100 chars
    expect(
      syncService.isBase64Image(
        'https://example.supabase.co/storage/v1/object/public/issue-images/uid/1.jpg'
      )
    ).toBe(false);
    expect(syncService.isBase64Image(null)).toBe(false);
    expect(syncService.isBase64Image(42)).toBe(false);
    expect(syncService.isBase64Image({})).toBe(false);
  });
});

describe('syncService.base64ToFile', () => {
  it('builds a File with the MIME type taken from the data URL', async () => {
    const file = await syncService.base64ToFile(PNG_DATA_URL, 'offline.png');

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe('offline.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBe(PNG_BYTES);

    const bytes = new Uint8Array(await file.arrayBuffer());
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]); // PNG signature
  });

  it('defaults to image/jpeg for raw base64 input', async () => {
    const file = await syncService.base64ToFile(PNG_BASE64);
    expect(file.type).toBe('image/jpeg');
    expect(file.name).toBe('image.jpg');
    expect(file.size).toBe(PNG_BYTES);
  });

  it('rejects invalid base64', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      syncService.base64ToFile('data:image/png;base64,%%%not-base64%%%')
    ).rejects.toThrow();
    spy.mockRestore();
  });
});
