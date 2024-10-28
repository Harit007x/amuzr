/*
  Warnings:

  - A unique constraint covering the columns `[songId]` on the table `Song` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Song_songId_key" ON "Song"("songId");
