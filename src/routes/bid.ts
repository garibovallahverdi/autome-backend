import { Router } from 'express';
import { ensureAuthenticated } from '../middleware/authMiddleware';
import BidController from '../controller/bidController';
const router = Router();

const bidController = new BidController()


// Teklif verme
router.post('/place-bid', ensureAuthenticated, (req, res, next) => bidController.placeBid(req, res, next));

export default router;