import { Expose, Transform, Type } from "class-transformer"
import { TransactionTypes } from "src/infrastructure/data/enums/transaction-types"
import { User } from "src/infrastructure/entities/user/user.entity"
import { UserResponse } from "src/modules/user/dto/response/user-response"

export class TransactionResponse {
    @Expose()
    id: string
    @Expose()
    amount: number
    @Expose()
    type: TransactionTypes
    @Expose()
    
    created_at: Date



    @Expose()
    @Type(() => UserResponse)
    user: User

    @Expose()
    meta_data: string
}