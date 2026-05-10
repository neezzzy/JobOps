import { addDaysIsoDate, displayDate, todayIsoDate } from './dates';

describe('dates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns stable ISO date strings', () => {
    expect(todayIsoDate()).toBe('2026-05-01');
    expect(addDaysIsoDate(3)).toBe('2026-05-04');
  });

  it('handles missing and invalid display dates', () => {
    expect(displayDate(null)).toBe('Not set');
    expect(displayDate('not-a-date')).toBe('not-a-date');
  });
});
