import express from 'express';
import UserController from '../controller/user';

const router = express.Router();
const userController = new UserController();


router.get('/:userId/get-participat-auctions', (req, res, next) => userController.getParticipatedAuctions(req, res, next));
router.get('/:userId/get-user-own-auctions', (req, res, next) => userController.getUserOwnAuctions(req, res, next));

router.post('/:userId/change-password', (req, res,next) => userController.changePassword(req, res,next));
router.post('/:userId/update-user-info', (req, res,next) => userController.updateUser(req, res,next));
router.post('/:userId/get-user-win-auctions', (req, res,next) => userController.getWinnerAuctions(req, res,next));

export default router
