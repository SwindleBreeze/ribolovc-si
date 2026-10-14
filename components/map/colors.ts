import type { WaterType } from '@/lib/schema';

export const TYPE_COLORS: Record<WaterType | 'forbidden', string> = {
  river: '#2a7bd4',
  lake: '#0b8573',
  reservoir: '#0b8573',
  pond: '#0b8573',
  sea: '#7c3aed',
  forbidden: '#dc2626',
};
