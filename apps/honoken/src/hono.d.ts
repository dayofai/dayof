import type { 
    PassPathParams,
    PassIdParams,
    DevicePassRegistrationsParams,
    RegisterDevicePayload,
    LogMessagesPayload
} from './schemas';

// This declaration merges with the HonoRequest interface from Hono
declare module 'hono' {
    interface HonoRequest {
        valid<T extends 'json' | 'form' | 'query' | 'param'>(
            target: T
        ): T extends 'param' 
            ? PassPathParams | PassIdParams | DevicePassRegistrationsParams // Union of all possible param types
            : T extends 'json'
            ? RegisterDevicePayload | LogMessagesPayload // Union of all possible JSON body types
            : any; // Add other types like query, form as needed
    }
}

declare module '@hono/zod-validator' {
    interface ValidatedPayload {
        param: {
            [key: string]: PassPathParams | PassIdParams | DevicePassRegistrationsParams | Record<string, any>;
        };
        json: {
            [key: string]: RegisterDevicePayload | LogMessagesPayload | Record<string, any>;
        };
    }
} 