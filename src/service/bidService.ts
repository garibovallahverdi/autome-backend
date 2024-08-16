import prisma from "../config/db";
import { scheduleBidJob } from "../utils/queues";

export class BidService {



  async  placeBid(userId: string, auctionId: string, bidAmount: number) {
    // Check if the user is a participant in the auction
    const participant = await prisma.participant.findUnique({
      where: {
        userId_auctionId: {
          userId,
          auctionId,
        },
      },
      select: {
        bidCount: true, // Select the bidCount to check its value
      },
    });
  
    if (!participant) {
      throw new Error('User is not a participant in this auction');
    }
  
    // Check if the bidCount is zero or negative
    if (participant.bidCount <= 0) {
      throw new Error('Your bid count is exhausted. Please make a payment to place more bids.');
    }
  
    // Get the current highest bid
    const highestBid = await prisma.bid.findFirst({
      where: { auctionId },
      orderBy: { amount: 'desc' },
      select: { amount: true, userId: true },
    });
  
    if (highestBid) {
      // Check if the bid amount is higher than the current highest bid
      if (bidAmount <= highestBid.amount) {
        throw new Error('Bid amount must be higher than the current highest bid');
      }
  
      // Prevent the user from placing consecutive bids on their own highest bid
      if (highestBid.userId === userId) {
        throw new Error('You cannot place consecutive bids on your own highest bid');
      }
    }
  
    // Create the bid
    const bid = await prisma.bid.create({
      data: {
        amount: bidAmount,
        userId,
        auctionId,
      },
    });
  
    // Update the bid count for the participant
    await prisma.participant.update({
      where: {
        userId_auctionId: {
          userId,
          auctionId,
        },
      },
      data: {
        bidCount: { decrement: 1 }, // Decrement the bidCount by 1
      },
    });
  
    // Update the bid count for the auction
    await prisma.auction.update({
      where: { id: auctionId },
      data: { bidCounts: { increment: 1 } },
    });
    await scheduleBidJob(auctionId);

    return bid;
  }
  
}
