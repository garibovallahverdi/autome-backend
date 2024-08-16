import { NextFunction, Request, Response } from 'express';
import UserService from '../service/userService'; 

class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }
  async getParticipatedAuctions(req: Request, res: Response,next:NextFunction) {
    try {
      const userId = req.params.userId;

      const auctions = await this.userService.getParticipatedAuctions(userId);

      res.status(200).json(auctions);
    } catch (error) {
        next(error)
    }
  }

  async getUserOwnAuctions(req: Request, res: Response,next:NextFunction) {
    try {
      const userId = req.params.userId;

      const auctions = await this.userService.getUserOwnAuctions(userId);

      res.status(200).json(auctions);
    } catch (error) {
        next(error)
    }
  }

  async changePassword(req: Request, res: Response,next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const {userId} = req.params

      const result = await this.userService.changePassword(userId, oldPassword, newPassword);

      res.status(200).json(result);
    } catch (error) {
     next(error)
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: 'Yetkisiz erişim' });
      }

      const { firstName,lastName, email, location } = req.body;
      const {userId} =req.params

      // Kullanıcı ID'si session'dan alınır
      // const userId = req.user?.id;

      // Kullanıcı verilerini güncelle
      const updatedUser = await this.userService.updateUserInfo({ id: userId, firstName, lastName, email, location });

      res.status(200).json(updatedUser);
    } catch (error) {
      next(error);
    }
  }
  

  async getWinnerAuctions(req: Request, res: Response, next: NextFunction) {
    const userId = req.params.userId; // Kullanıcı ID'si URL parametresinden alınır
  
    try {
      const winnerAuctions = await this.userService.getWinnerAuctionsByUserId(userId);
      res.status(200).json(winnerAuctions);
    } catch (error) {
      next(error);
    }
  };

}

export default UserController;
