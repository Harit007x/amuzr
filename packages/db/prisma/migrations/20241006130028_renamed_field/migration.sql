/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `SpotifyTokens` table. All the data in the column will be lost.
  - Added the required column `expires_in` to the `SpotifyTokens` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SpotifyTokens" DROP COLUMN "expiresAt",
ADD COLUMN     "expires_in" INTEGER NOT NULL;
