import Bull from 'bull';
import prisma from '../config/db';

const auctionQueue = new Bull('auctionQueue', {
  redis: {  port: parseInt(process.env.REDIS_PORT as string, 10),
  host: Number(process.env.REDIS_HOST),
  password: process.env.REDIS_PASSWORD, },
});

// Auction başlangıç job'u
auctionQueue.process('startAuction', async (job) => {
  const { auctionId } = job.data;

  try {
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'active' },
    });
    console.log(`Auction ${auctionId} has started and status updated to active.`);
  } catch (error) {
    console.error(`Failed to update auction ${auctionId} to active: ${error}`);
    throw new Error(`Failed to update auction ${auctionId} to active: ${error}`);
  }
});

// Hiç teklif gelmezse auction'ı tamamlayan job
auctionQueue.process('completeAuctionNoBids', async (job) => {
  const { auctionId } = job.data;

  try {
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'completed' },
    });
    console.log(`Auction ${auctionId} completed due to no bids within 3 days.`);
  } catch (error) {
    console.error(`Failed to update auction ${auctionId} to completed: ${error}`);
    throw new Error(`Failed to update auction ${auctionId} to completed: ${error}`);
  }
});

// Teklif sonrası auction'ı tamamlayan job
auctionQueue.process('completeAuctionAfterBid', async (job) => {
  const { auctionId } = job.data;

  try {
    await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'completed' },
    });
    console.log(`Auction ${auctionId} completed after 3 hours since the last bid.`);
  } catch (error) {
    console.error(`Failed to update auction ${auctionId} to completed after bid: ${error}`);
    throw new Error(`Failed to update auction ${auctionId} to completed after bid: ${error}`);
  }
});

// Job tamamlandığında
auctionQueue.on('completed', (job) => {
  console.log(`Job ${job.id} for auction ${job.data.auctionId} completed successfully.`);
});

// Job başarısız olduğunda
auctionQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} for auction ${job.data.auctionId} failed: ${error}`);
});

// Auction start ve no bids job'larını ayarlayan fonksiyon
export const scheduleAuctionJobs = async (auction: any) => {
  console.log(`Scheduling jobs for auction ${auction.id}`);

  await auctionQueue.add('startAuction', { auctionId: auction.id }, {
    delay: new Date(auction.startTime).getTime() - Date.now(),
  });
  console.log(`Job scheduled to start auction ${auction.id} at ${auction.startTime}`);
  
  const auctionEndDelay = new Date(auction.startTime).getTime() + 3 * 24 * 60 * 60 * 1000 - Date.now();

  await auctionQueue.add('completeAuctionNoBids', { auctionId: auction.id }, {
    delay: auctionEndDelay, 
    jobId: `completeAuctionNoBids-${auction.id}`,
  });
  console.log(`Job scheduled to complete auction ${auction.id} if no bids are placed within 3 days.`);
};

// Teklif sonrası job'ı ayarlayan fonksiyon
export const scheduleBidJob = async (auctionId: string) => {
  console.log(`Scheduling bid job for auction ${auctionId}`);

  const noBidsJob = await auctionQueue.getJob(`completeAuctionNoBids-${auctionId}`);
  if (noBidsJob) {
    await noBidsJob.remove();
    console.log(`Removed no bids job for auction ${auctionId} after a bid was placed.`);
  }

  const oldBidJob = await auctionQueue.getJob(`completeAuctionAfterBid-${auctionId}`);
  if (oldBidJob) {
    await oldBidJob.remove();
    console.log(`Removed old bid job for auction ${auctionId}`);
  }

  await auctionQueue.add('completeAuctionAfterBid', { auctionId }, {
    delay: 3 * 60 * 60 * 1000,
    jobId: `completeAuctionAfterBid-${auctionId}`,
  });
  console.log(`New job scheduled to complete auction ${auctionId} 3 hours after the last bid.`);
};
