import { describe, it, expect } from 'vitest';
import { mapRarity } from './rarity';

describe('mapRarity', () => {
  it('should map all known Magic rarity codes to full names', () => {
    expect(mapRarity('C')).toBe('Common');
    expect(mapRarity('L')).toBe('Land');
    expect(mapRarity('M')).toBe('Mythic Rare');
    expect(mapRarity('P')).toBe('Promo');
    expect(mapRarity('R')).toBe('Rare');
    expect(mapRarity('S')).toBe('Special');
    expect(mapRarity('T')).toBe('Token');
    expect(mapRarity('U')).toBe('Uncommon');
  });

  it('should return unknown codes as-is', () => {
    expect(mapRarity('X')).toBe('X');
    expect(mapRarity('Foil')).toBe('Foil');
  });

  it('should return null for null input', () => {
    expect(mapRarity(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(mapRarity(undefined)).toBeNull();
  });

  it('should not map lowercase codes', () => {
    expect(mapRarity('c')).toBe('c');
    expect(mapRarity('r')).toBe('r');
  });

  it('should return empty string as-is', () => {
    expect(mapRarity('')).toBe('');
  });
});
