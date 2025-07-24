// auth.test.js - Unit tests for authentication utilities

const { generateToken, verifyToken, extractTokenFromHeader } = require('../../src/utils/auth');
const jwt = require('jsonwebtoken');

// Mock user object
const mockUser = {
  _id: '507f1f77bcf86cd799439011',
  username: 'testuser',
  email: 'test@example.com',
  role: 'user',
};

describe('Authentication Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockUser);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
      
      // Verify the token can be decoded
      const decoded = jwt.decode(token);
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should include expiration time', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.decode(token);
      
      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const token = generateToken(mockUser);
      const decoded = verifyToken(token);
      
      expect(decoded.id).toBe(mockUser._id);
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.email).toBe(mockUser.email);
      expect(decoded.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.string';
      
      expect(() => {
        verifyToken(invalidToken);
      }).toThrow('Invalid token');
    });

    it('should throw error for expired token', () => {
      // Create token with very short expiration
      const shortLivedToken = jwt.sign(
        { id: mockUser._id },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-development',
        { expiresIn: '1ms' }
      );
      
      // Wait for token to expire
      setTimeout(() => {
        expect(() => {
          verifyToken(shortLivedToken);
        }).toThrow();
      }, 10);
    });

    it('should throw error for malformed token', () => {
      const malformedToken = 'not-a-valid-jwt';
      
      expect(() => {
        verifyToken(malformedToken);
      }).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'valid.jwt.token';
      const authHeader = `Bearer ${token}`;
      
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(null);
      expect(extracted).toBeNull();
    });

    it('should return null for undefined header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for header without Bearer prefix', () => {
      const token = 'valid.jwt.token';
      const authHeader = token; // Missing 'Bearer ' prefix
      
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });

    it('should return null for empty header', () => {
      const extracted = extractTokenFromHeader('');
      expect(extracted).toBeNull();
    });

    it('should return null for header with wrong prefix', () => {
      const token = 'valid.jwt.token';
      const authHeader = `Basic ${token}`;
      
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBeNull();
    });

    it('should handle header with extra spaces', () => {
      const token = 'valid.jwt.token';
      const authHeader = `Bearer  ${token}`; // Extra space
      
      const extracted = extractTokenFromHeader(authHeader);
      expect(extracted).toBe(` ${token}`); // Includes the extra space
    });
  });
});
