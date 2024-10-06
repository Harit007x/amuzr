-- CreateTable
CREATE TABLE "SpotifyTokens" (
    "id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SpotifyTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyTokens_access_token_key" ON "SpotifyTokens"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyTokens_refresh_token_key" ON "SpotifyTokens"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "SpotifyTokens_userId_key" ON "SpotifyTokens"("userId");

-- AddForeignKey
ALTER TABLE "SpotifyTokens" ADD CONSTRAINT "SpotifyTokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
