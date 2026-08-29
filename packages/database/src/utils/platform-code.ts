import crypto from "crypto";

export function generatePlatformCode(
    userType?: "STUDENT" | "FACULTY" | "INDIVIDUAL"
): string {
    const prefix =
        userType === "STUDENT"
            ? "AF-STU"
            : userType === "FACULTY"
            ? "AF-FAC"
            : "AF-USR";

    // Alphanumeric character pool (unambiguous uppercase characters: 32 distinct symbols)
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const bytes = crypto.randomBytes(7);
    let alphanumericPart = "";

    for (let i = 0; i < 7; i++) {
        alphanumericPart += charset[bytes[i] % charset.length];
    }

    return `${prefix}-${alphanumericPart}`;
}
