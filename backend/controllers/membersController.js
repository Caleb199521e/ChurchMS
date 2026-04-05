const Member = require('../models/Member');
const path = require('path');
const fs = require('fs');

// @desc    Health check
// @route   GET /api/members/health
exports.health = (req, res) => {
  res.json({ success: true, message: 'Members API is running' });
};

// @desc    Download bulk upload template
// @route   GET /api/members/template/download
exports.downloadTemplate = (req, res, next) => {
  try {
    const templatePath = path.join(__dirname, '../templates/members_template.csv');
    
    // Log for debugging
    console.log('=== TEMPLATE DOWNLOAD REQUEST ===');
    console.log('Template path:', templatePath);
    console.log('File exists:', fs.existsSync(templatePath));
    
    // Check if file exists
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template file not found at:', templatePath);
      // List what IS in the templates directory
      const templatesDir = path.join(__dirname, '../templates');
      console.log('Templates directory contents:', fs.readdirSync(templatesDir));
      
      return res.status(404).json({ 
        success: false, 
        message: 'Template file not found',
        attempted_path: templatePath
      });
    }

    // Read file content
    const fileContent = fs.readFileSync(templatePath, 'utf-8');
    console.log('✅ Template file found, size:', fileContent.length, 'bytes');
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="members_template.csv"');
    res.setHeader('Content-Length', Buffer.byteLength(fileContent));
    
    console.log('✅ Sending file to client');
    // Send file content
    res.send(fileContent);
  } catch (err) {
    console.error('❌ Download template error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading template',
      error: err.message 
    });
  }
};

// @desc    Get all members (with search, filter, pagination)
// @route   GET /api/members
exports.getMembers = async (req, res, next) => {
  try {
    const { search, department, role, page = 1, limit = 20, isActive } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) query.department = department;
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Member.countDocuments(query);
    const members = await Member.find(query)
      .populate('department', 'name')
      .sort({ fullName: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: members.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: members
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single member
// @route   GET /api/members/:id
exports.getMember = async (req, res, next) => {
  try {
    const member = await Member.findById(req.params.id).populate('department', 'name');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

// @desc    Create member
// @route   POST /api/members
exports.createMember = async (req, res, next) => {
  try {
    const member = await Member.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

// @desc    Update member
// @route   PUT /api/members/:id
exports.updateMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('department', 'name');

    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    res.json({ success: true, data: member });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete member
// @route   DELETE /api/members/:id
exports.deleteMember = async (req, res, next) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    res.json({ success: true, message: 'Member deleted.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all members (no pagination, for attendance marking)
// @route   GET /api/members/all
exports.getAllMembers = async (req, res, next) => {
  try {
    const members = await Member.find({ isActive: true })
      .select('fullName phone department')
      .populate('department', 'name')
      .sort({ fullName: 1 });
    res.json({ success: true, count: members.length, data: members });
  } catch (err) {
    next(err);
  }
};

// @desc    Bulk create members
// @route   POST /api/members/bulk
exports.bulkCreateMembers = async (req, res, next) => {
  try {
    const { members: membersData } = req.body;

    if (!Array.isArray(membersData) || membersData.length === 0) {
      return res.status(400).json({ success: false, message: 'No members provided' });
    }

    const results = {
      created: [],
      failed: []
    };

    for (let i = 0; i < membersData.length; i++) {
      try {
        const memberData = membersData[i];

        // Validate required field
        if (!memberData.fullName || !memberData.fullName.trim()) {
          results.failed.push({
            row: i + 2,
            name: memberData.fullName || 'Unknown',
            error: 'Missing required field: fullName'
          });
          continue;
        }

        // Create member
        const member = await Member.create({
          fullName: memberData.fullName.trim(),
          phone: memberData.phone?.trim() || undefined,
          email: memberData.email?.trim() || undefined,
          gender: memberData.gender?.toLowerCase() || undefined,
          role: memberData.role?.toLowerCase() || 'member',
          department: memberData.department || undefined,
          address: memberData.address?.trim() || undefined,
          joinDate: memberData.joinDate || new Date(),
          notes: memberData.notes?.trim() || undefined,
          isActive: true
        });

        results.created.push({
          _id: member._id,
          fullName: member.fullName,
          email: member.email
        });
      } catch (err) {
        results.failed.push({
          row: i + 2,
          name: membersData[i].fullName || 'Unknown',
          error: err.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${results.created.length} members${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
      data: results
    });
  } catch (err) {
    next(err);
  }
};
