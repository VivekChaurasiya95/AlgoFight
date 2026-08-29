// apps/api/src/gateway/policies/ip-jail.ts
import { logger } from "@algofight/logger";

interface JailRecord {
    failedAttempts: number;
    jailedUntil: number;
}

export class IpJail {
    private readonly jailRecords = new Map<string, JailRecord>();

    public isJailed(ip: string): boolean {
        const record = this.jailRecords.get(ip);
        if (!record) return false;

        // If not actually jailed yet
        if (record.jailedUntil === 0) return false;

        const now = Date.now();
        if (now > record.jailedUntil) {
            this.jailRecords.delete(ip);
            return false;
        }
        return true;
    }

    public recordFailedAttempt(
        ip: string,
        maxAttempts: number = 10,
        jailDurationSeconds: number = 60
    ): boolean {
        const now = Date.now();
        let record = this.jailRecords.get(ip);

        if (!record || (record.jailedUntil > 0 && now > record.jailedUntil)) {
            record = {
                failedAttempts: 1,
                jailedUntil: 0,
            };
        } else {
            record.failedAttempts++;
        }

        if (record.failedAttempts >= maxAttempts) {
            record.jailedUntil = now + jailDurationSeconds * 1000;
            logger.warn(
                { ip, failedAttempts: record.failedAttempts, jailDurationSeconds },
                "IP temporarily placed in Gateway Jail"
            );
            this.jailRecords.set(ip, record);
            return true;
        }

        this.jailRecords.set(ip, record);
        return false;
    }

    public reset(ip: string): void {
        this.jailRecords.delete(ip);
    }
}

export const ipJail = new IpJail();