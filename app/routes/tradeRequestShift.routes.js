import tradeRequestShift from "../controllers/tradeRequestShift.controller.js";
import authenticate from "../authorization/authorization.js";
import { Router } from "express";

var router = Router();

// Create a new Trade Request (Post a shift to the board)
router.post("/", [authenticate], tradeRequestShift.create);

// Retrieve all Trade Requests (Main board view)
router.get("/", [authenticate], tradeRequestShift.findAll);

router.get("/pending-count", [authenticate], tradeRequestShift.getPendingCount);

router.put("/:id/decline", [authenticate], tradeRequestShift.decline);

// Retrieve a single Trade Request with id
router.get("/:id", [authenticate], tradeRequestShift.findOne);



// Update a Trade Request (e.g., when an employee clicks "Claim" to add their ID)
router.put("/:id/claim", [authenticate], tradeRequestShift.claimShift);

// Finalize a Trade (When Employer clicks "Accept" - updates Shift and Request)
router.post("/:id/approve", [authenticate], tradeRequestShift.approveTrade);

// Delete a Trade Request (The "Remove" button in your screenshot)
router.delete("/:id", [authenticate], tradeRequestShift.delete);

export default router;