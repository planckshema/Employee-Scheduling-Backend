import db from "../models/index.js";
import logger from "../config/logger.js";

const TradeRequestShift = db.tradeRequestShift;
const Shift = db.shift;
const Employee = db.employee;
const Op = db.Sequelize.Op;
const exports = {};

// Create and Save a new Trade Request (Post a shift to the board)
exports.create = (req, res) => {
    if (!req.body.ShiftID) {
        return res.status(400).send({ message: "ShiftID is required to post to the board!" });
    }

    const tradeRequest = {
        ShiftID: req.body.ShiftID,
        OriginalOwnerID: req.body.OriginalOwnerID || null, // Null if Employer Post
        postType: req.body.postType || 'Employee Drop',
        status: 'Available',
        message: req.body.message || ""
    };

    TradeRequestShift.create(tradeRequest)
        .then(data => {
            logger.info(`Trade request created for Shift ID: ${data.ShiftID}`);
            res.status(201).send(data);
        })
        .catch(err => {
            logger.error(`Error creating trade request: ${err.message}`);
            res.status(500).send({ message: err.message || "Error creating Trade Request." });
        });
};

// Retrieve all Trade Requests with associated Data (Shift + Employee Names)
exports.findAll = (req, res) => {
    TradeRequestShift.findAll({
        include: [
            { model: Shift },
            { model: Employee, as: 'OriginalOwner' },
            { model: Employee, as: 'Requester' }
        ]
    })
        .then(data => res.send(data))
        .catch(err => {
            logger.error(`Error retrieving trades: ${err.message}`);
            res.status(500).send({ message: "Error retrieving Trade Board data." });
        });
};

// Handle an Employee "Claiming" a shift (Updates RequesterID and Status)
exports.claimShift = (req, res) => {
    const id = req.params.id;

    TradeRequestShift.update({
        RequesterID: req.body.RequesterID,
        message: req.body.message, // "I am available and would like to take this shift"
        status: 'Pending'
    }, {
        where: { TradeRequestID: id }
    })
        .then(num => {
            if (num == 1) res.send({ message: "Shift claimed successfully. Awaiting approval." });
            else res.send({ message: `Cannot update TradeRequest with id=${id}.` });
        })
        .catch(err => res.status(500).send({ message: "Error claiming shift." }));
};

// Finalize/Approve a Trade (The "Accept" button)
exports.approveTrade = async (req, res) => {
    const id = req.params.id;

    try {
        // 1. Get the Trade Request details
        const trade = await TradeRequestShift.findByPk(id);
        if (!trade) return res.status(404).send({ message: "Trade Request not found." });

        // 2. Update the actual Shift owner
        await Shift.update(
            { EmployeeID: trade.RequesterID },
            { where: { ShiftId: trade.ShiftID } }
        );

        // 3. Mark the trade as Approved (or delete it if you prefer a clean board)
        trade.status = 'Approved';
        await trade.save();

        logger.info(`Trade ${id} approved. Shift ${trade.ShiftID} moved to Employee ${trade.RequesterID}`);
        res.send({ message: "Trade approved and shift reassigned!" });

    } catch (err) {
        logger.error(`Approval Error: ${err.message}`);
        res.status(500).send({ message: "Failed to finalize the trade." });
    }
};

// Retrieve a single Trade Request
exports.findOne = (req, res) => {
    const id = req.params.id;
    TradeRequestShift.findByPk(id, { include: [{ model: Shift }, { model: Employee, as: 'OriginalOwner' }] })
        .then(data => res.send(data))
        .catch(err => res.status(500).send({ message: "Error retrieving trade details." }));
};

// Delete a Trade Request (The "Remove" button)
exports.delete = (req, res) => {
    const id = req.params.id;
    TradeRequestShift.destroy({ where: { TradeRequestID: id } })
        .then(num => res.send({ message: num == 1 ? "Trade removed." : "Could not delete." }))
        .catch(err => res.status(500).send({ message: "Error deleting trade." }));
};

exports.getAvailableShiftsForBoard = async (req, res) => {
    try {
        // Find all ShiftIDs already on the trade board
        const existingTrades = await TradeRequestShift.findAll({ attributes: ['ShiftID'] });
        const tradeIds = existingTrades.map(t => t.ShiftID);

        // Find shifts NOT in that list
        const shifts = await Shift.findAll({
            where: {
                shiftId: { [Op.notIn]: tradeIds.length ? tradeIds : [0] }
            },
            include: [{ model: Employee }]
        });
        res.send(shifts);
    } catch (err) {
        res.status(500).send({ message: "Error fetching shifts for board." });
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const [pendingCount, availableCount] = await Promise.all([
            TradeRequestShift.count({
                where: { status: 'Pending' }
            }),
            TradeRequestShift.count({
                where: { status: 'Available' }
            })
        ]);

        res.send({
            pendingCount,
            availableCount,
            attentionCount: pendingCount + availableCount
        });
    } catch (err) {
        res.status(500).send({ message: "Error counting trade board items." });
    }
};

// Reset trade request to 'Available' and clear the requester
exports.decline = (req, res) => {

    const id = req.params.id;

    TradeRequestShift.update(
        {
            status: 'Available',
            RequesterID: null
        },
        { where: { TradeRequestID: id } }
    )
        .then(num => {
            if (num == 1) {
                res.send({ message: "Trade request declined and reset to Available." });
            } else {
                res.status(404).send({ message: `Cannot decline trade with id=${id}.` });
            }
        })
        .catch(err => {
            res.status(500).send({ message: "Error declining trade request." });
        });
};

export default exports;
