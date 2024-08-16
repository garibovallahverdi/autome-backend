import prisma from "../config/db";
import { DateTime } from 'luxon';
import {  scheduleAuctionJobs } from "../utils/queues";

type CarDetailFilter = {
	manufacturer: string;
	model: string;
	minMileage: string;
	maxMileage: string;
	minYear: string;
	maxYear: string;
	color: string;
	page: string,
	limit: string
};

class AuctionService {
	async getNextLotNumber(): Promise<number> {
		const auctions = await prisma.auction.findMany({
			orderBy: {
				lotNumber: "asc",
			},
		});

		let expectedLotNumber = 1;
		for (const auction of auctions) {
			if (auction.lotNumber !== expectedLotNumber) {
				return expectedLotNumber;
			}
			expectedLotNumber++;
		}

		return expectedLotNumber;
	}

	// Auction ve CarDetail oluşturma ve ilişkilendirme
	async createAuctionWithCarDetails(data: {
		lotName: string;
		ownerId: string;
		ownerName: string;
		location: string;
		startPrice: number;
		interval?: number;
		image: string[];
		startTime: string; 
		status: "scheduled" | "active" | "completed";
		detailsText: string;
		carDetail: {
		  manufacturer: string;
		  brand: string;
		  model: string;
		  year: string;
		  vehicleType: string;
		  color: string;
		  mileage: string;
		  engineCapacity: string;
		  carSegments: string;
		  driveType: string;
		  engine: string;
		  transmission: string;
		  fuelType: string;
		  brakeSystem: string;
		};
	  }) {
		const {
		  lotName,
		  ownerId,
		  ownerName,
		  location,
		  startPrice,
		  interval,
		  image,
		  startTime,
		  status,
		  detailsText,
		  carDetail,
		} = data;
		const isoDateString = startTime;
		const targetTimeZone = "Asia/Baku"; // 
		const utcDate = DateTime.fromISO(isoDateString, { zone: targetTimeZone }).toUTC();


		const startTimeDate = utcDate.toJSDate()
	  
		// Validate if startTimeDate is valid
		if (isNaN(startTimeDate.getTime())) {
			console.log(startTimeDate);
			
		  throw new Error("Invalid start time date format.");
		}
	  
		const currentTime = new Date();
	    
		console.log(currentTime,"current");
		console.log(startTimeDate,"start");
		
		if (startTimeDate < currentTime) {
		  throw new Error("The start time must be in the future.");
		}
	  
		const lotNumber = await this.getNextLotNumber();
		const slug = `${lotName.toLowerCase().replace(/\s+/g, "-")}-${lotNumber}`;
	  
		const createdAuction = await prisma.auction.create({
		  data: {
			lotName,
			ownerId,
			ownerName,
			location,
			startPrice,
			interval: interval || 0,
			image,
			startTime: startTimeDate,
			status,
			detailsText,
			lotNumber,
			slug,
			carDetail: {
			  create: {
				manufacturer: carDetail.manufacturer,
				brand: carDetail.brand,
				model: carDetail.model,
				year: carDetail.year,
				vehicleType: carDetail.vehicleType,
				color: carDetail.color,
				mileage: carDetail.mileage,
				engineCapacity: carDetail.engineCapacity,
				carSegments: carDetail.carSegments,
				driveType: carDetail.driveType,
				engine: carDetail.engine,
				transmission: carDetail.transmission,
				fuelType: carDetail.fuelType,
				brakeSystem: carDetail.brakeSystem,
			  },
			},
		  },
		});

	
	      await scheduleAuctionJobs(createdAuction);

		return createdAuction;
	  }
	  
	  


	async addBidderToAuction(userId: string, auctionId: string) {
		const auction = await prisma.auction.findUnique({
			where: {
				id: auctionId,
			},
			select: {
				ownerId: true,
				status: true,
			},
		});

		if (!auction) {
			throw new Error("Auction not found");
		}

		if (auction.ownerId === userId) {
			throw new Error("Users cannot participate in their own auctions");
		}

		if (auction.status !== "active") {
			throw new Error("Auction is not active");
		}

		const existingParticipant = await prisma.participant.findUnique({
			where: {
				userId_auctionId: {
					userId,
					auctionId,
				},
			},
			include: { auctions: true },
		});

		if (existingParticipant) {
			throw new Error("User is already a participant in this auction");
		}

		// Add the user as a participant
		const participant = await prisma.participant.create({
			data: {
				userId,
				auctionId,
				bidCount: 10,
			},
		});

		return participant;
	}

	async getAuctions(filter: CarDetailFilter) {
		const { manufacturer, model, minMileage, maxMileage, minYear, maxYear, color, page, limit } = filter;
		const take = +limit;
		const skip = (+page * +limit) - (+limit);

		return await prisma.auction.findMany({
			where: {
				carDetail: {
					manufacturer: {
						mode: 'insensitive',
						equals: manufacturer
					},
					model: {
						mode: 'insensitive',
						equals: model
					},
					mileage: {
						gt: minMileage,
						lt: maxMileage,
					},
					year: {
						gt: minYear,
						lt: maxYear,
					},
					color,
				},
			},
			orderBy: {
				createdAt: 'desc'
			},
			skip: skip,
			take: take
		});
	}

	async getAuctionById(id: string) {
		const auction = await prisma.auction.findUnique({
		  where: {
			id,
		  },
		  include: {
			carDetail: true,
		  },
		});
	  
		if (!auction) {
		  throw new Error(`Auction with ID ${id} not found`);
		}
	  
		return auction;
	  }

	  

	
}

export {CarDetailFilter, AuctionService};
