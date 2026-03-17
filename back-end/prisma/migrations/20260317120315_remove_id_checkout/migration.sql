/*
  Warnings:

  - You are about to drop the column `stripeCheckoutSessionId` on the `Subscription` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Subscription_stripeCheckoutSessionId_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "stripeCheckoutSessionId";
