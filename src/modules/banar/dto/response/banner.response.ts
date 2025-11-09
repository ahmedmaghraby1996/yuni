import { Expose, Transform } from "class-transformer";
import { toUrl } from "src/core/helpers/file.helper";

export class BannerResponse{
    @Expose() id: number;
    @Expose() @Transform(({ value }) => toUrl(value)) banar: string;
    @Expose() started_at: Date;
    @Expose() ended_at: Date;
    @Expose() is_active: boolean;
    @Expose() is_popup: boolean;
    @Expose() order_by: number;
}