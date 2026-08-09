import { Expose, Transform } from "class-transformer"
import { TransactionTypes } from "src/infrastructure/data/enums/transaction-types"
import { TransactionStatus } from "src/infrastructure/data/enums/transaction-status.enum"

export class TransactionResponse {
    @Expose()
    id: string

    @Expose()
    number: string

    @Expose()
    amount: number

    @Expose()
    type: TransactionTypes

    @Expose()
    status: TransactionStatus

    @Expose()
    created_at: Date

    @Expose()
    meta_data: string

    @Expose()
    user_id: string

    @Transform(({ obj }) => obj.user ? { id: obj.user.id, name: obj.user.name, email: obj.user.email, phone: obj.user.phone } : null)
    @Expose()
    user: any
}
