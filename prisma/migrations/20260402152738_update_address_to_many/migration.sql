-- DropIndex
DROP INDEX "addresses_user_id_key";

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "title" TEXT NOT NULL DEFAULT 'บ้าน';
