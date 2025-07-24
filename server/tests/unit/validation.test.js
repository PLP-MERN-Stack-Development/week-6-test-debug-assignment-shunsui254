// validation.test.js - Unit tests for validation utilities

const {
  isValidEmail,
  validatePassword,
  validateUsername,
  sanitizeString,
  isValidObjectId,
} = require('../../src/utils/validation');

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname-lastname@example.com',
        '123@example.com',
        'test_email@example-domain.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user.example.com',
        'user@.com',
        'user@domain',
        '',
        null,
        undefined,
        'user name@example.com', // Space in email
        'user@domain..com', // Double dot
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MySecure123',
        'Test1234Pass',
        'Strong1',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject passwords that are too short', () => {
      const shortPasswords = ['123', 'Pass', '12345'];

      shortPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 6 characters long');
      });
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'a'.repeat(129);
      
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters');
    });

    it('should reject passwords without lowercase letters', () => {
      const password = 'PASSWORD123!';
      
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without uppercase letters', () => {
      const password = 'password123!';
      
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without numbers', () => {
      const password = 'PasswordTest!';
      
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should handle null or undefined passwords', () => {
      [null, undefined, ''].forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 6 characters long');
      });
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'USERNAME',
        'user_name_123',
        'abc',
        'a'.repeat(30), // Maximum length
      ];

      validUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject usernames that are too short', () => {
      const shortUsernames = ['a', 'ab', ''];

      shortUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Username must be at least 3 characters long');
      });
    });

    it('should reject usernames that are too long', () => {
      const longUsername = 'a'.repeat(31);
      
      const result = validateUsername(longUsername);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username must be less than 30 characters');
    });

    it('should reject usernames with invalid characters', () => {
      const invalidUsernames = [
        'user-name', // Hyphen not allowed
        'user.name', // Dot not allowed
        'user name', // Space not allowed
        'user@name', // @ not allowed
        'user#name', // # not allowed
        'user+name', // + not allowed
      ];

      invalidUsernames.forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Username can only contain letters, numbers, and underscores');
      });
    });

    it('should handle null or undefined usernames', () => {
      [null, undefined].forEach(username => {
        const result = validateUsername(username);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Username must be at least 3 characters long');
      });
    });
  });

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const maliciousInput = 'Hello <script>alert("xss")</script> World';
      const sanitized = sanitizeString(maliciousInput);
      
      expect(sanitized).toBe('Hello  World');
      expect(sanitized).not.toContain('<script>');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = sanitizeString(input);
      
      expect(sanitized).toBe('Hello World');
    });

    it('should handle complex script tags', () => {
      const inputs = [
        '<script type="text/javascript">alert("xss")</script>',
        '<SCRIPT>alert("xss")</SCRIPT>',
        '<script src="malicious.js"></script>',
        'Before<script>alert("xss")</script>After',
      ];

      inputs.forEach(input => {
        const sanitized = sanitizeString(input);
        expect(sanitized).not.toContain('<script');
        expect(sanitized).not.toContain('</script>');
      });
    });

    it('should handle non-string inputs', () => {
      const nonStringInputs = [
        null,
        undefined,
        123,
        {},
        [],
        true,
      ];

      nonStringInputs.forEach(input => {
        const sanitized = sanitizeString(input);
        expect(sanitized).toBe('');
      });
    });

    it('should preserve safe HTML-like text', () => {
      const safeInput = 'Price: $5 < $10 and > $1';
      const sanitized = sanitizeString(safeInput);
      
      expect(sanitized).toBe(safeInput);
    });
  });

  describe('isValidObjectId', () => {
    it('should validate correct MongoDB ObjectIds', () => {
      const validObjectIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '5f8d0d55b54764421b7156c9',
        'AAAAAAAAAAAAAAAAAAAAAAAA',
        '000000000000000000000000',
      ];

      validObjectIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(true);
      });
    });

    it('should reject invalid ObjectIds', () => {
      const invalidObjectIds = [
        'invalid-id',
        '507f1f77bcf86cd79943901', // Too short
        '507f1f77bcf86cd799439011a', // Too long
        '507f1f77bcf86cd799439g11', // Invalid character 'g'
        '',
        null,
        undefined,
        123,
        {},
        [],
        'not-hex-string',
        '507f1f77-bcf8-6cd7-9943-9011', // UUID format, not ObjectId
      ];

      invalidObjectIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(false);
      });
    });
  });
});
