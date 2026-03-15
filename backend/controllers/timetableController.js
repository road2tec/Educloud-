import Timetable from '../models/Timetable.js';
import { generateOptimalTimetable } from '../services/geminiService.js';
import { logger } from '../utils/logger.js';
import { sanitizeInput, isValidObjectId } from '../utils/validators.js';
import validate from '../middlewares/validation.js';

// Create timetable (admin/staff, with optional AI suggestion)
export const createTimetable = [
  validate('timetable'),
  async (req, res, next) => {
    try {
      const { class: className, section, slots, subjects, useAI } = req.body;
      const sanitized = {
        class: sanitizeInput(className),
        section: sanitizeInput(section),
      };

      // Check for existing timetable
      const existingTimetable = await Timetable.findOne({ class: sanitized.class, section: sanitized.section });
      if (existingTimetable) {
        const error = new Error('Timetable already exists for this class/section');
        error.statusCode = 400;
        throw error;
      }

      let finalSlots = slots;
      let aiConflicts = [];
      if (useAI) {
        // Use Gemini for AI suggestions
        const constraints = { class: sanitized.class, section: sanitized.section, slots };
        const aiTimetable = await generateOptimalTimetable(sanitized, constraints);
        finalSlots = aiTimetable.slots || slots; // Extract slots array from AI response
        aiConflicts = aiTimetable.conflicts || []; // Extract conflicts from AI response
      }

      // Basic conflict detection (e.g., overlapping slots)
      const conflicts = [...aiConflicts]; // Start with AI-detected conflicts
      finalSlots.forEach((slot, i) => {
        finalSlots.forEach((otherSlot, j) => {
          if (i !== j && slot.day === otherSlot.day) {
            if (slot.startTime < otherSlot.endTime && slot.endTime > otherSlot.startTime) {
              conflicts.push(`Overlap on ${slot.day} between ${slot.startTime}-${slot.endTime} and ${otherSlot.startTime}-${otherSlot.endTime}`);
            }
          }
        });
      });

      const timetable = new Timetable({
        ...sanitized,
        slots: finalSlots,
        subjects,
        generatedByAI: !!useAI,
        conflicts,
      });
      await timetable.save();

      logger.info(`Timetable created: ${sanitized.class} ${sanitized.section}`);
      res.status(201).json({ success: true, timetable });
    } catch (error) {
      logger.error(`Create timetable error: ${error.message}`, { class: req.body.class });
      next(error);
    }
  },
];

// Update timetable (admin/staff)
export const updateTimetable = [
  validate('timetable'),
  async (req, res, next) => {
    try {
      const timetableId = req.params.id;
      const { class: className, section, slots } = req.body;

      if (!isValidObjectId(timetableId)) {
        const error = new Error('Invalid timetable ID');
        error.statusCode = 400;
        throw error;
      }

      const timetable = await Timetable.findById(timetableId);
      if (!timetable) {
        const error = new Error('Timetable not found');
        error.statusCode = 404;
        throw error;
      }

      // Update fields
      timetable.class = sanitizeInput(className) || timetable.class;
      timetable.section = sanitizeInput(section) || timetable.section;
      timetable.slots = slots || timetable.slots;
      timetable.updatedAt = new Date();

      // Recheck conflicts
      const conflicts = [];
      timetable.slots.forEach((slot, i) => {
        timetable.slots.forEach((otherSlot, j) => {
          if (i !== j && slot.day === otherSlot.day) {
            if (slot.startTime < otherSlot.endTime && slot.endTime > otherSlot.startTime) {
              conflicts.push(`Overlap on ${slot.day} between ${slot.startTime}-${slot.endTime} and ${otherSlot.startTime}-${otherSlot.endTime}`);
            }
          }
        });
      });
      timetable.conflicts = conflicts;

      await timetable.save();
      logger.info(`Timetable updated: ${timetableId}`);
      res.json({ success: true, timetable });
    } catch (error) {
      logger.error(`Update timetable error: ${error.message}`, { timetableId });
      next(error);
    }
  },
];

// Get timetable (accessible to all roles)
export const getTimetable = async (req, res, next) => {
  let timetableId;
  try {
    timetableId = req.params.id;
    if (!isValidObjectId(timetableId)) {
      const error = new Error('Invalid timetable ID');
      error.statusCode = 400;
      throw error;
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      const error = new Error('Timetable not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info(`Timetable fetched: ${timetableId}`);
    res.json({ success: true, timetable });
  } catch (error) {
    logger.error(`Fetch timetable error: ${error.message}`, { timetableId });
    next(error);
  }
};

// Get all timetables (accessible to all roles)
export const getAllTimetables = async (req, res, next) => {
  try {
    const timetables = await Timetable.find({}).sort({ createdAt: -1 });
    
    logger.info(`All timetables fetched: ${timetables.length} found`);
    res.json({ success: true, timetables });
  } catch (error) {
    logger.error(`Fetch all timetables error: ${error.message}`);
    next(error);
  }
};

// Delete timetable (admin/staff only)
export const deleteTimetable = async (req, res, next) => {
  let timetableId;
  try {
    timetableId = req.params.id;
    if (!isValidObjectId(timetableId)) {
      const error = new Error('Invalid timetable ID');
      error.statusCode = 400;
      throw error;
    }

    const timetable = await Timetable.findById(timetableId);
    if (!timetable) {
      const error = new Error('Timetable not found');
      error.statusCode = 404;
      throw error;
    }

    await Timetable.findByIdAndDelete(timetableId);
    logger.info(`Timetable deleted: ${timetableId}`);
    res.json({ success: true, message: 'Timetable deleted successfully' });
  } catch (error) {
    logger.error(`Delete timetable error: ${error.message}`, { timetableId });
    next(error);
  }
};
