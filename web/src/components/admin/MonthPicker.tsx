import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';

interface Props {
  value: string; // YYYY-MM
  onChange: (month: string) => void;
}

/** A month/year picker that emits a YYYY-MM string. */
export function MonthPicker({ value, onChange }: Props) {
  return (
    <DatePicker
      label="Month"
      views={['year', 'month']}
      format="MM/YYYY"
      value={dayjs(`${value}-01`)}
      onChange={(v: Dayjs | null) => {
        if (v && v.isValid()) onChange(v.format('YYYY-MM'));
      }}
      slotProps={{ textField: { size: 'small' } }}
    />
  );
}

export function currentMonth(): string {
  return dayjs().format('YYYY-MM');
}
