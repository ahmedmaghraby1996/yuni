import { Exclude, Expose, Transform } from "class-transformer";
import { toUrl } from "src/core/helpers/file.helper";
import { Role } from "src/infrastructure/data/enums/role.enum";

export class RegisterResponse {
    @Expose() id: string;
    @Expose() account: string;
 
    @Expose() name: string;
    @Transform(({ value }) => toUrl(value))
    @Expose() avatar: string;
    @Expose() username: string;
    @Expose() email: string;
    @Expose() email_verified_at: Date;
    @Expose() phone: string;
    @Expose() phone_verified_at: Date;
    @Expose() birth_date: string;
    @Expose() gender: string;
    @Expose() role: Role;
    @Expose() language: string;
    @Expose() school_id: string;
    @Expose() fcm_token: string;
    
    

    // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
   
}
