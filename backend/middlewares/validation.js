import Joi from 'joi';

// Validation schemas
const schemas = {
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'staff', 'student', 'teacher', 'parent').required(),
    // Optional profile fields
    fullName: Joi.string().allow(''),
    phone: Joi.string().allow(''),
    address: Joi.string().allow(''),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  exam: Joi.object({
    title: Joi.string().min(3).required(),
    description: Joi.string().allow(''),
    scheduledDate: Joi.date().iso().required(),
    duration: Joi.number().min(1).required(),
    subject: Joi.string().required(), // For AI question generation
    numQuestions: Joi.number().min(1).max(50).default(10), // Number of questions to generate
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'), // Difficulty level
  }),
  timetable: Joi.object({
    class: Joi.string().required(),
    section: Joi.string().allow(''),
    slots: Joi.array().items(
      Joi.object({
        day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
        startTime: Joi.string().pattern(/^[0-2][0-9]:[0-5][0-9]$/).required(),
        endTime: Joi.string().pattern(/^[0-2][0-9]:[0-5][0-9]$/).required(),
        subject: Joi.string().allow(''),
        location: Joi.string().allow(''),
      })
    ),
    useAI: Joi.boolean().default(false), // Whether to use AI for timetable generation
  }),
  document: Joi.object({
    type: Joi.string().valid('lesson_plan', 'assignment', 'study_guide', 'quiz', 'worksheet', 'assessment').required(),
    subject: Joi.string().required(),
    topic: Joi.string().required(),
    gradeLevel: Joi.string().required(),
    duration: Joi.number().min(5).max(480).required(), // 5 minutes to 8 hours
    requirements: Joi.string().allow('').max(1000),
    tags: Joi.array().items(Joi.string()).max(10),
  }),
  meeting: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().allow('').max(1000),
    date: Joi.string().required(), // YYYY-MM-DD format from frontend
    time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    duration: Joi.number().min(15).max(480).required(), // 15 minutes to 8 hours
    type: Joi.string().valid('classroom', 'parent_teacher', 'staff', 'training', 'general', 'online', 'webinar').required(),
    participants: Joi.any().optional(), // Allow any format for participants
    location: Joi.string().allow('').max(200),
    meetingLink: Joi.string().allow('').max(500), // Allow any string format for meeting links
    meetingUrl: Joi.string().allow('').max(500), // Alternative field name
    isPublic: Joi.boolean().optional(), // Allow public meetings
    maxParticipants: Joi.number().min(1).max(1000).optional(), // Optional participant limit
    requiresApproval: Joi.boolean().optional(), // Whether joining requires approval
  }),
  chatMessage: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    context: Joi.object().optional(),
  }),
};

// Middleware to validate request body
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return res.status(400).json({ message: 'Invalid validation schema' });
    }

    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
      console.log('Validation error details:', error.details); // Add logging
      return res.status(400).json({ message: 'Validation error', details: error.details });
    }
    next();
  };
};

// Export individual validators for convenience
export const validateRegister = validate('register');
export const validateLogin = validate('login');
export const validateExam = validate('exam');
export const validateTimetable = validate('timetable');
export const validateDocument = validate('document');
export const validateMeeting = validate('meeting');
export const validateChatMessage = validate('chatMessage');

export default validate;
