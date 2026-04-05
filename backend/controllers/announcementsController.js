const Announcement = require('../models/Announcement');

// @desc    Get all announcements
// @route   GET /api/announcements
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { isActive: true };
    // Filter out expired announcements
    query.$or = [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }];

    const total = await Announcement.countDocuments(query);
    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, count: announcements.length, total, data: announcements });
  } catch (err) {
    next(err);
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
exports.createAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    res.json({ success: true, data: announcement });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (err) {
    next(err);
  }
};
