import { Request, Response } from "express";
import { AuctionService, CarDetailFilter } from "../service/auctionService";
import { NextFunction } from "express-serve-static-core";

class AuctionController {
	auctionService: AuctionService;

	constructor() {
		this.auctionService = new AuctionService();
	}

	async createAuction(req: Request, res: Response, next: NextFunction) {
		try {
			const auction = await this.auctionService.createAuctionWithCarDetails(req.body);
			res.status(201).json(auction);
		} catch (error) {
			next(error);
		}
	}

	async addBidder(req: Request, res: Response, next: NextFunction) {
		try {
			const { userId, auctionId } = req.body;

			const participant = await this.auctionService.addBidderToAuction(userId, auctionId);

			res.status(201).json(participant);
		} catch (error) {
			next(error);
		}
	}

	async listAuctions(req: Request, res: Response, next: NextFunction) {
		const { manufacturer, model, minMileage, maxMileage, maxYear, minYear, color, page, limit } = req.query as CarDetailFilter;

		try {
			const auctions = await this.auctionService.getAuctions({
				manufacturer,
				model,
				minMileage,
				maxMileage,
				minYear,
				maxYear,
				color,
				page,
				limit
			});

			res.status(200).send(auctions);
		} catch (error) {
			next(error);
		}
	}




	
	async getAuction(req: Request, res: Response, next: NextFunction) {
		try {
		  const id = req.params.id;
		  const auction = await this.auctionService.getAuctionById(id);
		  res.status(200).json(auction);
		} catch (error) {
		  next(error);
		}
	  }
	
}

export default AuctionController;
