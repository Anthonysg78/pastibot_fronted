declare module 'react-phone-input-2' {
    import React from 'react';

    export interface PhoneInputProps {
        country?: string;
        value?: string;
        onChange?: (phone: string, country: any, e: any, formattedValue: string) => void;
        inputStyle?: React.CSSProperties;
        containerStyle?: React.CSSProperties;
        buttonStyle?: React.CSSProperties;
        dropdownStyle?: React.CSSProperties;
        searchStyle?: React.CSSProperties;
        inputClass?: string;
        containerClass?: string;
        buttonClass?: string;
        dropdownClass?: string;
        searchClass?: string;
        autoFormat?: boolean;
        disabled?: boolean;
        enableSearch?: boolean;
        disableSearchIcon?: boolean;
        enableAreaCodes?: boolean;
        prefix?: string;
        placeholder?: string;
        searchPlaceholder?: string;
        regions?: string | string[];
        onlyCountries?: string[];
        excludeCountries?: string[];
        preferredCountries?: string[];
        priority?: { [key: string]: number };
        areaCodes?: { [key: string]: string[] };
        masks?: { [key: string]: string };
        localization?: { [key: string]: string };
        renderStringAsFlag?: string;
        preserveOrder?: string[];
        defaultErrorMessage?: string;
        specialLabel?: string;
        alwaysDefaultMask?: boolean;
        isValid?: ((value: string, country: any, countries: any[], hiddenAreaCodes: any[]) => boolean | string) | boolean;
        defaultMask?: string;
        copyNumbersOnly?: boolean;
        onCreateLabel?: (label: string) => string;
        searchNotFound?: string;
        onEnterKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onBlur?: (e: React.FocusEvent<HTMLInputElement>, data: any) => void;
        onFocus?: (e: React.FocusEvent<HTMLInputElement>, data: any) => void;
        onClick?: (e: React.MouseEvent<HTMLInputElement>, data: any) => void;
        onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    }

    const PhoneInput: React.FC<PhoneInputProps>;
    export default PhoneInput;
}
