/*
  Warnings:

  - You are about to drop the column `recommended_product_id` on the `fortune_logs` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "fortune_logs" DROP CONSTRAINT "fortune_logs_recommended_product_id_fkey";

-- AlterTable
ALTER TABLE "fortune_logs" DROP COLUMN "recommended_product_id";

-- CreateTable
CREATE TABLE "_RecommendedProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RecommendedProducts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RecommendedProducts_B_index" ON "_RecommendedProducts"("B");

-- AddForeignKey
ALTER TABLE "_RecommendedProducts" ADD CONSTRAINT "_RecommendedProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "fortune_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RecommendedProducts" ADD CONSTRAINT "_RecommendedProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
