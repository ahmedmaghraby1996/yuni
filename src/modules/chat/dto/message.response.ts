import { Expose, Transform, Type } from "class-transformer";
import { UserResponse } from "src/modules/user/dto/response/user-response";

export class MessageRespone {
    @Expose() id: string;
    @Expose() @Type(() => UserResponse) sender:UserResponse
    @Expose() content: string;
    @Expose() created_at: Date;
    @Expose() chat_id: string;
    @Expose() is_seen: boolean;
    
}