import Cryptr from 'cryptr';
require('dotenv').config();

/** The Secure Storage module of Evelyn that keeps your shit safe. */
export class SecureStorage {
	private cryptr: Cryptr;

	constructor() {
		this.cryptr = new Cryptr(process.env.DECRYPTION_KEY, {
			pbkdf2Iterations: 15000,
			saltLength: 15,
		});
	}

	/**
	 * Encrypts the provided value.
	 * @public
	 * @param value The value that will be encrypted.
	 * @param client The Evelyn object.
	 * @returns {string}
	 */
	public encrypt(value: string): string | undefined {
		if (!value) return;
		return this.cryptr.encrypt(value);
	}

	/**
	 * Decrypts the provided value.
	 * @public
	 * @param encryptedValue The value that will be decrypted.
	 * @param client The Evelyn object.
	 * @returns {string}
	 */
	public decrypt(encryptedValue: string): string | undefined {
		if (!encryptedValue) return;
		return this.cryptr.decrypt(encryptedValue);
	}
}
