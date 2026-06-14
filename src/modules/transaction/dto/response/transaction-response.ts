import { Expose } from "class-transformer"
import { TransactionTypes } from "src/infrastructure/data/enums/transaction-types"

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
    created_at: Date

    @Expose()
    meta_data: string
}
