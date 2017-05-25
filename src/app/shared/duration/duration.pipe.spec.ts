import { DurationPipe } from './duration.pipe';

describe('DurationPipe', () => {

  let pipe = new DurationPipe();

  const transform = (val: number): string => {
    return pipe.transform(val, []);
  };

  it('returns 00:00 for null value', () => {
    expect(transform(null)).toMatch('00:00');
  });

  it('translates seconds to readable durations', () => {
    expect(transform(3450)).toMatch('57:30');
  });
});
