-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_ifsc_code" TEXT,
ADD COLUMN     "bank_name" TEXT;

-- AlterTable
ALTER TABLE "payruns" ADD COLUMN     "computed_at" TIMESTAMP(3),
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_date" DATE,
ADD COLUMN     "validated_at" TIMESTAMP(3);
