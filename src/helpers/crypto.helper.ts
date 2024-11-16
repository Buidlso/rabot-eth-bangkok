import { Injectable } from '@nestjs/common';
import { generateKeyPair, randomUUID } from 'crypto';

import type { TValidDecimalUnit } from '@/domain';

@Injectable()
export class CryptoHelper {
  public genUUID(): string {
    return randomUUID();
  }

  public getAmountUnit(amount: number, decimal: TValidDecimalUnit): number {
    return Math.pow(10, decimal) * amount;
  }

  public getBufferFromUtf8(utf8: string): Buffer {
    return Buffer.from(utf8, 'utf-8');
  }

  public genKeyPair(): Promise<{
    privateKey: string;
    publicKey: string;
  }> {
    return new Promise((resolve, reject) => {
      generateKeyPair(
        'rsa',
        {
          modulusLength: 4096,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        },
        (err, publicKey, privateKey) => {
          if (err) {
            reject(err);
          } else {
            resolve({ privateKey, publicKey });
          }
        }
      );
    });
  }
}
