import {isAfter, isBefore, isSameDay, startOfDay} from 'date-fns';

export const normalize = (d: Date) => startOfDay(d);
export const inRange = (day: Date, a: Date | null, b: Date | null) => {
  const x = normalize(day);
  const from = a ? normalize(a) : a;
  const to = b ? normalize(b) : b;

  return (
    (!from || !to || isBefore(from, to)) &&
    ((from && isSameDay(x, from)) ||
      (to && isSameDay(x, to)) ||
      ((!from || isAfter(x, from)) && (!to || isBefore(x, to))))
  );
};
