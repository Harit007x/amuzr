/*
  Warnings:

  - You are about to drop the column `thumbnail` on the `Song` table. All the data in the column will be lost.
  - Added the required column `imageUrl` to the `Song` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Song" DROP COLUMN "thumbnail",
ADD COLUMN     "imageUrl" TEXT NOT NULL;
