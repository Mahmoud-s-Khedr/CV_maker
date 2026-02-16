import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';

const ISSUER = 'HandisCV';

export function generateTotpSecret(email: string): { secret: string; uri: string } {
    const totp = new OTPAuth.TOTP({
        issuer: ISSUER,
        label: email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: new OTPAuth.Secret(),
    });

    return {
        secret: totp.secret.base32,
        uri: totp.toString(),
    };
}

export function verifyTotpCode(secret: string, code: string): boolean {
    const totp = new OTPAuth.TOTP({
        issuer: ISSUER,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret: OTPAuth.Secret.fromBase32(secret),
    });

    // Window of 1 allows ±30 seconds tolerance
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
}

export async function generateQrCodeDataUrl(uri: string): Promise<string> {
    return QRCode.toDataURL(uri);
}
