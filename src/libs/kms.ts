import { PolicyDocument } from './iam';
import { Tag, AwsStrings } from './misc-aws-utils';
import { KMSClient } from '@aws-sdk/client-kms';
import { STAGE } from './env';

export const kmsClient = new KMSClient(
  STAGE === 'local' ? { region: STAGE } : {}
);

export const defaultKeyPolicy: PolicyDocument = {
  Version: '2012-10-17',
  Statement: {
    Sid: 'Enable IAM policies',
    Effect: 'Allow',
    Principal: {
      AWS: { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' }
    },
    Action: 'kms:*',
    Resource: '*'
  }
};

export type KMSKey = {
  Type: 'AWS::KMS::Key';
  Properties: {
    Description?: string;
    Enabled?: boolean;
    EnableKeyRotation?: boolean;
    KeyPolicy: PolicyDocument;
    KeySpec?:
      | 'ECC_NIST_P256'
      | 'ECC_NIST_P384'
      | 'ECC_NIST_P521'
      | 'ECC_SECG_P256K1'
      | 'HMAC_224'
      | 'HMAC_256'
      | 'HMAC_384'
      | 'HMAC_512'
      | 'RSA_2048'
      | 'RSA_3072'
      | 'RSA_4096'
      | 'SM2'
      | 'SYMMETRIC_DEFAULT';
    KeyUsage?: 'ENCRYPT_DECRYPT' | 'SIGN_VERIFY' | 'GENERATE_VERIFY_MAC';
    MultiRegion?: boolean;
    PendingWindowInDays?: number;
    Tags?: Tag[];
  };
};

export type KMSAlias = {
  Type: 'AWS::KMS::Alias';
  Properties: {
    AliasName: AwsStrings;
    TargetKeyId: AwsStrings;
  };
};

export const stringToUint8Array = (str: string): Uint8Array => {
  return Uint8Array.from([...str].map((char) => char.charCodeAt(0)));
};

export const Uint8ArrayToStr = (array: Uint8Array): string => {
  let out, i, c;
  let char2, char3;

  out = '';
  const len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
    }
  }

  return out;
};
