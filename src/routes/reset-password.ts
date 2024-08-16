import express from 'express'
import {  resetPassword, resetPasswordRequest, verifyResetCode } from '../controller/reset-password'

const router = express.Router()

router.post('/request-password-reset',resetPasswordRequest)
router.get('/check-reset-password-token',verifyResetCode)
router.post('/reset-password/',resetPassword)


export default router