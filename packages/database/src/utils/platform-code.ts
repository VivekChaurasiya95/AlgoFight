export function generatePlatformCode(
    userType?: "STUDENT" | "FACULTY" | "INDIVIDUAL"): string {
    const prefix = userType === "STUDENT" ? "AF-STU" :
        userType === "FACULTY" ? "AF-FAC" : "AF-USR";
    const randomNum = Math.floor(100000 + Math.random() * 9000000);

    return `${prefix}-${randomNum}`;
}
