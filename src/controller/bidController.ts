import { Request, Response } from 'express';
import { BidService } from '../service/bidService'; 
import { NextFunction } from 'express-serve-static-core';

 class BidController {
  private bidService: BidService;

  constructor() {
    this.bidService = new BidService();
  }

  async placeBid(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { userId, auctionId, bidAmount } = req.body;

    try {
      const bid = await this.bidService.placeBid(userId, auctionId, bidAmount);
      res.status(201).json(bid);
    } catch (error: any) {
      next(error)
    }
  }
}

export default BidController