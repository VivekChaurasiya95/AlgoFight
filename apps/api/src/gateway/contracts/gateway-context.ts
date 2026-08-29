import { GatewayPolicy } from "../policies/gateway.policy";

export enum GatewayType {
    USER = "USER",
    CONTEST = "CONTEST",
    INSTITUTION = "INSTITUTION",
    REGIONAL = "REGIONAL"
}

export interface GatewayContext {
    readonly gatewayId: string;
    readonly type: GatewayType;
    readonly contextId: string;
    readonly name: string;
    readonly capacity: number;
    readonly policy: GatewayPolicy;
    readonly metadata?: Record<string, any>;

}