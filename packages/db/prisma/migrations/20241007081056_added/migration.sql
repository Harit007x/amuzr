/*
  Warnings:

  - A unique constraint covering the columns `[room_code]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `room_code` to the `Room` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "room_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Room_room_code_key" ON "Room"("room_code");
