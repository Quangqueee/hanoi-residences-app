/**
 * Ported from Web `Apartment01/src/lib/password-utils.ts`
 */

export type PasswordStrengthLevel =
  | 'weak'
  | 'medium'
  | 'strong'
  | 'very_strong';

export type PasswordCheckResult = {
  isValid: boolean;
  errors: string[];
  strengthLevel: PasswordStrengthLevel;
};

export function checkPasswordStrength(password: string): PasswordCheckResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  } else if (password.length > 24) {
    errors.push('Mật khẩu không được vượt quá 24 ký tự');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ cái thường (a-z)');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ cái hoa (A-Z)');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ số (0-9)');
  }

  let strengthLevel: PasswordStrengthLevel = 'weak';

  if (errors.length === 0) {
    if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strengthLevel = 'very_strong';
    } else if (password.length >= 12) {
      strengthLevel = 'strong';
    } else {
      strengthLevel = 'medium';
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    strengthLevel,
  };
}

export function checkPasswordMatch(
  password: string,
  confirmPassword: string,
): { isValid: boolean; errorMessage?: string } {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      errorMessage: 'Mật khẩu nhắc lại không khớp',
    };
  }
  return { isValid: true };
}

export function checkPhoneNumber(phoneNumber: string): {
  isValid: boolean;
  errorMessage?: string;
} {
  const cleanPhone = phoneNumber.trim().replace(/\s/g, '');
  const regex = /^(\+84|0)?[3|5|7|8|9][0-9]{8}$/;

  if (!regex.test(cleanPhone)) {
    return {
      isValid: false,
      errorMessage:
        'Số điện thoại không hợp lệ (ví dụ: 0901234567 hoặc +84901234567)',
    };
  }

  return { isValid: true };
}

export function getPasswordStrengthMessage(
  strengthLevel: PasswordStrengthLevel,
): string {
  const messages: Record<PasswordStrengthLevel, string> = {
    weak: 'Mật khẩu yếu',
    medium: 'Mật khẩu trung bình',
    strong: 'Mật khẩu mạnh',
    very_strong: 'Mật khẩu rất mạnh',
  };
  return messages[strengthLevel];
}
