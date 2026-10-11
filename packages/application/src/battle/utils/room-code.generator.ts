import crypto from "crypto";

export class RoomCodeGenerator {
    static generate(): string {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";

        let code = "";
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `BTL-${code}`;
    }

    static generateSquadCodes(): { alphaCode: string; betaCode: string; alphaHash: string; betaHash: string } {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let aSuffix = "";
        let bSuffix = "";
        for (let i = 0; i < 4; i++) {
            aSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
            bSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const alphaCode = `SQ-ALP-${aSuffix}`;
        const betaCode = `SQ-BET-${bSuffix}`;
        const alphaHash = crypto.createHash("sha256").update(alphaCode).digest("hex");
        const betaHash = crypto.createHash("sha256").update(betaCode).digest("hex");

        return { alphaCode, betaCode, alphaHash, betaHash };
    }

    static hashTeamCode(code: string): string {
        return crypto.createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
    }
}