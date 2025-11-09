import { Expose, Transform } from "class-transformer";
import { toUrl } from "src/core/helpers/file.helper";
import { User } from "src/infrastructure/entities/user/user.entity";

export class SuggestionsComplaintResponse{

    @Expose()
    id: string;

    @Expose()
    title: string;
    @Expose()
    description: string;

    @Expose()
    email: string;

    @Expose()
    created_at: Date;

    @Expose()
@Transform(( value ) => {return {phone:value.obj.user.phone,id:value.obj.user.id, avatar:toUrl(value.obj.user.avatar),name:value.obj.user.name}})
    user:User
    
}