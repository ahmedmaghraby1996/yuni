import { ApiProperty } from "@nestjs/swagger";
import { StaticPagesEnum } from "src/infrastructure/data/enums/static-pages.enum";

export class GetStaticPage {
    @ApiProperty({ description: 'Static page type', required: true, enum: StaticPagesEnum })
    static_page_type: StaticPagesEnum;
}