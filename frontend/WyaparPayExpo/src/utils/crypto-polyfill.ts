/**
 * Crypto Polyfill for React Native
 * Required for AWS SDK and other Node.js modules
 */

// Import polyfills first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

// Make Buffer globally available
if (typeof global.Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

// Polyfill for crypto object
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}

// Polyfill for crypto.getRandomValues (already provided by react-native-get-random-values)
if (typeof global.crypto.getRandomValues === 'undefined') {
  global.crypto.getRandomValues = function getRandomValues<T extends ArrayBufferView>(
    array: T
  ): T {
    if (!(array instanceof Uint8Array)) {
      throw new Error('Only Uint8Array is supported');
    }

    const randomBytes = Crypto.getRandomBytes(array.length);
    array.set(randomBytes);
    return array;
  };
}

// Polyfill for crypto.randomUUID
if (typeof global.crypto.randomUUID === 'undefined') {
  (global.crypto as any).randomUUID = function randomUUID(): string {
    return Crypto.randomUUID();
  };
}

// Polyfill for crypto.subtle (basic implementation)
if (typeof global.crypto.subtle === 'undefined') {
  (global.crypto as any).subtle = {
    digest: async function digest(algorithm: string, data: ArrayBuffer) {
      // Convert algorithm string to Crypto.CryptoDigestAlgorithm
      let alg: Crypto.CryptoDigestAlgorithm;
      const algStr = algorithm.toLowerCase().replace('-', '');

      switch (algStr) {
        case 'sha1':
          alg = Crypto.CryptoDigestAlgorithm.SHA1;
          break;
        case 'sha256':
          alg = Crypto.CryptoDigestAlgorithm.SHA256;
          break;
        case 'sha384':
          alg = Crypto.CryptoDigestAlgorithm.SHA384;
          break;
        case 'sha512':
          alg = Crypto.CryptoDigestAlgorithm.SHA512;
          break;
        default:
          throw new Error(`Unsupported algorithm: ${algorithm}`);
      }

      // Convert ArrayBuffer to base64
      const uint8Array = new Uint8Array(data);
      const base64 = Buffer.from(uint8Array).toString('base64');

      // Digest and return as ArrayBuffer
      const hash = await Crypto.digestStringAsync(alg, base64);
      const hashBuffer = Buffer.from(hash, 'hex');
      return hashBuffer.buffer;
    }
  };
}

export {};
