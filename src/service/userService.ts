import bcrypt from 'bcryptjs';
import prisma from '../config/db';


interface UpdateUserData {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  location?: string;
}

class UserService {
    async getParticipatedAuctions(userId: string) {
        const participations  = await prisma.participant.findMany({
          where: { userId },
          include: {
            auctions: true, 
          },
        });
    
        return participations.map((participation:any) => participation.auctions);
      }

      async getUserOwnAuctions(userId: string) {
        const participations  = await prisma.auction.findMany({
          where: { ownerId:userId },
          include: {
            owner: true, 
          },
        });
    
        return participations.map((participation:any) => participation.auctions);
      }



  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user =  await prisma.user.findUnique({where:{id:userId}});
    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Incorrect old password');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }


  async updateUserInfo(data: UpdateUserData) {
    const { id, firstName, lastName, email, location } = data;

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        location,
      },
    });

    return updatedUser;
  }


   async  getWinnerAuctionsByUserId(userId: string) {
    try {
      // Kullanıcının kazandığı açık artırmaları bul
      const winnerAuctions = await prisma.participant.findMany({
        where: {
          userId: userId,
          status: 'winner', 
        },
        include: {
          auctions: true, 
        },
      });
  
      return winnerAuctions.map(participant => participant.auctions);
    } catch (error) {
      console.error('Error fetching winner auctions:', error);
      throw new Error('Could not fetch winner auctions');
    }
  }
}

export default UserService;
