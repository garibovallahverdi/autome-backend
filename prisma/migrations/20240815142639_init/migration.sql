-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('scheduled', 'active', 'completed');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('participant', 'winner');

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lotName" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "carDetailId" TEXT,
    "ownerName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startPrice" INTEGER NOT NULL,
    "interval" INTEGER,
    "image" TEXT[],
    "startTime" TIMESTAMP(3) NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'scheduled',
    "detailsText" TEXT NOT NULL,
    "lotNumber" INTEGER NOT NULL,
    "bidCounts" INTEGER NOT NULL DEFAULT 0,
    "lotViews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarDetail" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "mileage" TEXT NOT NULL,
    "engineCapacity" TEXT NOT NULL,
    "carSegments" TEXT NOT NULL,
    "driveType" TEXT NOT NULL,
    "engine" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "fuelType" TEXT NOT NULL,
    "brakeSystem" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,

    CONSTRAINT "CarDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "googleId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "location" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "verificationCode" TEXT,
    "verificationCodeExpiresAt" TIMESTAMP(3),
    "resetPassswordCode" TEXT,
    "resetPassCodeExpiresAt" TIMESTAMP(3),
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bid" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,

    CONSTRAINT "Bid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "userId" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'participant',
    "bidCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("userId","auctionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Auction_slug_key" ON "Auction"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CarDetail_auctionId_key" ON "CarDetail"("auctionId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Auction" ADD CONSTRAINT "Auction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CarDetail" ADD CONSTRAINT "CarDetail_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bid" ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
