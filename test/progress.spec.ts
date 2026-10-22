import { calculateProgress } from '../src/common/progress';

describe('progress calculation', () => {
  it('calculates completed lessons / total lessons * 100', () => {
    expect(calculateProgress(4, 10)).toBe(40);
    expect(calculateProgress(16, 24)).toBe(66.67);
  });

  it('returns zero for a course with no lessons', () => {
    expect(calculateProgress(0, 0)).toBe(0);
  });

  it('clamps invalid lesson counts', () => {
    expect(calculateProgress(20, 10)).toBe(100);
    expect(calculateProgress(-1, 10)).toBe(0);
  });
});
