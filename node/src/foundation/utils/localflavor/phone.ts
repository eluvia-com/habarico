import {CountryFormat} from './types';

export const countries: CountryFormat[] = [
  {
    region: 'CZ',
    code: '+420',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 9);
      return formatted;
    },
  },
  {
    region: 'SK',
    code: '+421',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 9);
      return formatted;
    },
  },
  {
    region: 'DE',
    code: '+49',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6);
      return formatted;
    },
  },
  {
    region: 'AT',
    code: '+43',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 10);
      if (number.length > 10) formatted += ' ' + number.slice(10);
      return formatted;
    },
  },
  {
    region: 'FR',
    code: '+33',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 4);
      if (number.length > 4) formatted += ' ' + number.slice(4, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 8);
      if (number.length > 8) formatted += ' ' + number.slice(8);
      return formatted;
    },
  },
  {
    region: 'IT',
    code: '+39',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6);
      return formatted;
    },
  },
  {
    region: 'ES',
    code: '+34',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 9);
      return formatted;
    },
  },
  {
    region: 'PT',
    code: '+351',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 9);
      return formatted;
    },
  },
  {
    region: 'NL',
    code: '+31',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 1);
      if (number.length > 1) formatted += ' ' + number.slice(1, 4);
      if (number.length > 4) formatted += ' ' + number.slice(4, 8);
      return formatted;
    },
  },
  {
    region: 'BE',
    code: '+32',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 5);
      if (number.length > 5) formatted += ' ' + number.slice(5, 8);
      return formatted;
    },
  },
  {
    region: 'PL',
    code: '+48',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 9);
      return formatted;
    },
  },
  {
    region: 'SE',
    code: '+46',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 5);
      if (number.length > 5) formatted += ' ' + number.slice(5, 8);
      return formatted;
    },
  },
  {
    region: 'NO',
    code: '+47',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 3);
      if (number.length > 3) formatted += ' ' + number.slice(3, 5);
      if (number.length > 5) formatted += ' ' + number.slice(5, 8);
      return formatted;
    },
  },
  {
    region: 'DK',
    code: '+45',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 4);
      if (number.length > 4) formatted += ' ' + number.slice(4, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 8);
      return formatted;
    },
  },
  {
    region: 'GB',
    code: '+44',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 6);
      if (number.length > 6) formatted += ' ' + number.slice(6, 10);
      return formatted;
    },
  },
  {
    region: 'IE',
    code: '+353',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 5);
      if (number.length > 5) formatted += ' ' + number.slice(5, 9);
      return formatted;
    },
  },
  {
    region: 'CH',
    code: '+41',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 5);
      if (number.length > 5) formatted += ' ' + number.slice(5, 7);
      if (number.length > 7) formatted += ' ' + number.slice(7, 9);
      return formatted;
    },
  },
  {
    region: 'FI',
    code: '+358',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += number.slice(0, 2);
      if (number.length > 2) formatted += ' ' + number.slice(2, 5);
      if (number.length > 5) formatted += ' ' + number.slice(5, 8);
      return formatted;
    },
  },
  {
    region: 'US',
    code: '+1',
    format: (number: string) => {
      let formatted = '';
      if (number.length > 0) formatted += '(' + number.slice(0, 3);
      if (number.length > 2) formatted += ') ';
      if (number.length > 3) formatted += number.slice(3, 6);
      if (number.length > 6) formatted += '‑' + number.slice(6, 10);
      return formatted;
    },
  },
];

export const getCountryFormats = (allowedRegions?: string[]) => {
  return countries.filter((country) => !allowedRegions || allowedRegions.includes(country.region));
};

export const formatPhoneNumber = (value: string) => {
  if (!value) {
    return '';
  }
  const selectedCountryCode = countries.find(
    (c) => c.code === value?.toString().slice(0, c.code.length)
  )?.code;

  if (!selectedCountryCode) {
    return value;
  }
  const selectedCountry = countries.find((c) => c.code === selectedCountryCode);
  if (!selectedCountry) {
    return value;
  }
  const parsedValue = value.replace(/\D/g, '').slice(selectedCountryCode.length - 1);
  const formattedNumber = selectedCountry.format(parsedValue);
  return `${selectedCountryCode} ${formattedNumber}`.trim();
};

export const parsePhoneNumber = (value: string) => {
  return `+${value.replace(/\D/g, '')}`;
};

export const getCountryCode = (value: string, defaultRegion?: string) => {
  // Get country code from phone number value
  const countryFormat = getCountryFormat(value);
  if (!countryFormat) {
    return defaultRegion ? countries.find((c) => c.region === defaultRegion)?.code || '' : '';
  }
  return countryFormat?.code;
};

export const getCountryFormat = (value: string) => {
  // Get country format from phone number value
  return countries.find((c) => c.code === value?.toString().slice(0, c.code.length));
};
