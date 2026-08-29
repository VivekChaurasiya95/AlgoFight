// apps/api/src/gateway/factory/gateway.factory.ts
import { Gateway } from "../contracts/gateway";
import { GatewayContext, GatewayType } from "../contracts/gateway-context";
import { UserGateway } from "../implementations/user.gateway";

export class GatewayFactory {
    public static create(type: GatewayType, context: GatewayContext): Gateway {
        switch (type) {
            case GatewayType.USER:
            case GatewayType.CONTEST:
            case GatewayType.INSTITUTION:
            case GatewayType.REGIONAL:
                return new UserGateway(context);

            default:
                throw new Error(`Unsupported GatewayType: ${type}`);
        }
    }
}
