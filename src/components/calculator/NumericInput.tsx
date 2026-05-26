import React, { useState, useEffect } from 'react';

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (val: number) => void;
  allowDecimals?: boolean;
  min?: number;
  max?: number;
}

export default function NumericInput({
  value,
  onChange,
  allowDecimals = true,
  min,
  max,
  className,
  placeholder,
  id,
  ...props
}: NumericInputProps) {
  // We keep a local string state to allow natural typing (including trailing dots, e.g. "12.")
  const [localVal, setLocalVal] = useState<string>('');

  // Sync with parent value if it changes externally
  useEffect(() => {
    if (value === 0) {
      if (localVal !== '') setLocalVal('');
    } else {
      const parsedLocal = parseFloat(localVal);
      // If the parent number is different from parsed local representation, sync them
      if (isNaN(parsedLocal) || parsedLocal !== value) {
        setLocalVal(value.toString());
      }
    }
  }, [value]);

  const convertArabicToEnglish = (input: string): string => {
    if (!input) return '';
    let result = input;

    // Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩)
    const arabicIndic = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    for (let i = 0; i < 10; i++) {
      result = result.replace(arabicIndic[i], i.toString());
    }

    // Convert Persian numerals (۰۱۲۳۴۵۶۷۸۹)
    const persian = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    for (let i = 0; i < 10; i++) {
      result = result.replace(persian[i], i.toString());
    }

    // Convert Arabic comma (،) and normal comma (,) to decimal dot (.)
    result = result.replace(/،/g, '.').replace(/,/g, '.');

    return result;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const translated = convertArabicToEnglish(raw);

    // Filter characters
    let sanitized = allowDecimals
      ? translated.replace(/[^0-9\.]/g, '')
      : translated.replace(/[^0-9]/g, '');

    if (allowDecimals) {
      // Ensure only one dot exists
      const firstDotIdx = sanitized.indexOf('.');
      if (firstDotIdx !== -1) {
        sanitized =
          sanitized.slice(0, firstDotIdx + 1) +
          sanitized.slice(firstDotIdx + 1).replace(/\./g, '');
      }
    }

    setLocalVal(sanitized);

    if (sanitized === '' || sanitized === '.') {
      onChange(0);
    } else {
      let parsed = allowDecimals ? parseFloat(sanitized) : parseInt(sanitized, 10);
      if (!isNaN(parsed)) {
        if (min !== undefined && parsed < min) {
          // Keep the local representation but don't clip yet, or trigger callback
          // For UX, it is best to set the state, but we can clamp on blur if needed
        }
        if (max !== undefined && parsed > max) {
          parsed = max;
          setLocalVal(max.toString());
        }
        onChange(parsed);
      }
    }
  };

  const handleBlur = () => {
    // On loss of focus, enforce min limit if specified
    if (localVal === '' || localVal === '.') {
      if (min !== undefined) {
        setLocalVal(min.toString());
        onChange(min);
      } else {
        setLocalVal('');
        onChange(0);
      }
      return;
    }

    let parsed = allowDecimals ? parseFloat(localVal) : parseInt(localVal, 10);
    if (!isNaN(parsed)) {
      if (min !== undefined && parsed < min) {
        parsed = min;
      }
      if (max !== undefined && parsed > max) {
        parsed = max;
      }
      setLocalVal(parsed.toString());
      onChange(parsed);
    }
  };

  return (
    <input
      {...props}
      type="text"
      inputMode={allowDecimals ? 'decimal' : 'numeric'}
      id={id}
      value={localVal}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}
