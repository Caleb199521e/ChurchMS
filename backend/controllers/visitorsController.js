const Visitor = require('../models/Visitor');
const Member = require('../models/Member');
const path = require('path');
const fs = require('fs');

// @desc    Get all visitors
// @route   GET /api/visitors
exports.getVisitors = async (req, res, next) => {
  try {
    const { search, converted, page = 1, limit = 20 } = req.query;
    const query = { branchId: req.branchId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (converted !== undefined) query.converted = converted === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Visitor.countDocuments(query);
    const visitors = await Visitor.find(query)
      .sort({ firstVisitDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, count: visitors.length, total, data: visitors });
  } catch (err) {
    next(err);
  }
};

// @desc    Create visitor
// @route   POST /api/visitors
exports.createVisitor = async (req, res, next) => {
  try {
    const visitorData = { ...req.body, branchId: req.branchId };
    const visitor = await Visitor.create(visitorData);
    res.status(201).json({ success: true, data: visitor });
  } catch (err) {
    next(err);
  }
};

// @desc    Update visitor
// @route   PUT /api/visitors/:id
exports.updateVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found.' });
    res.json({ success: true, data: visitor });
  } catch (err) {
    next(err);
  }
};

// @desc    Convert visitor to member
// @route   POST /api/visitors/:id/convert
exports.convertToMember = async (req, res, next) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found.' });

    // Verify visitor belongs to user's branch
    if (visitor.branchId.toString() !== req.branchId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    // Create a new member from visitor data with branchId
    const member = await Member.create({
      fullName: visitor.name,
      phone: visitor.phone,
      email: visitor.email,
      branchId: visitor.branchId,
      joinDate: new Date(),
      ...req.body // allow extra member fields to be passed
    });

    // Mark visitor as converted
    visitor.converted = true;
    visitor.convertedDate = new Date();
    visitor.convertedMember = member._id;
    await visitor.save();

    res.json({ success: true, message: 'Visitor converted to member.', member });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete visitor
// @route   DELETE /api/visitors/:id
exports.deleteVisitor = async (req, res, next) => {
  try {
    const visitor = await Visitor.findByIdAndDelete(req.params.id);
    if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found.' });
    res.json({ success: true, message: 'Visitor deleted.' });
  } catch (err) {
    next(err);
  }
};

// @desc    Download bulk upload template
// @route   GET /api/visitors/template/download
exports.downloadTemplate = (req, res, next) => {
  try {
    const templatePath = path.join(__dirname, '../templates/visitors_template.csv');
    
    console.log('=== VISITORS TEMPLATE DOWNLOAD ===');
    console.log('Template path:', templatePath);
    console.log('File exists:', fs.existsSync(templatePath));
    
    if (!fs.existsSync(templatePath)) {
      console.error('❌ Template file not found at:', templatePath);
      const templatesDir = path.join(__dirname, '../templates');
      console.log('Templates directory contents:', fs.readdirSync(templatesDir));
      
      return res.status(404).json({ 
        success: false, 
        message: 'Template file not found',
        attempted_path: templatePath
      });
    }

    const fileContent = fs.readFileSync(templatePath, 'utf-8');
    console.log('✅ Template file found, size:', fileContent.length, 'bytes');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="visitors_template.csv"');
    res.setHeader('Content-Length', Buffer.byteLength(fileContent));
    
    console.log('✅ Sending file to client');
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

// @desc    Bulk create visitors
// @route   POST /api/visitors/bulk
exports.bulkCreateVisitors = async (req, res, next) => {
  try {
    const { visitors: visitorsData } = req.body;

    if (!Array.isArray(visitorsData) || visitorsData.length === 0) {
      return res.status(400).json({ success: false, message: 'No visitors provided' });
    }

    const results = {
      created: [],
      failed: []
    };

    for (let i = 0; i < visitorsData.length; i++) {
      try {
        const visitorData = visitorsData[i];

        // Validate required field
        if (!visitorData.name || !visitorData.name.trim()) {
          results.failed.push({
            row: i + 2,
            name: visitorData.name || 'Unknown',
            error: 'Missing required field: name'
          });
          continue;
        }

        // Create visitor
        const visitor = await Visitor.create({
          name: visitorData.name.trim(),
          phone: visitorData.phone?.trim() || undefined,
          email: visitorData.email?.trim() || undefined,
          firstVisitDate: visitorData.firstVisitDate || new Date(),
          invitedBy: visitorData.invitedBy?.trim() || undefined,
          address: visitorData.address?.trim() || undefined,
          notes: visitorData.notes?.trim() || undefined,
          branchId: req.branchId,
        });

        results.created.push({
          _id: visitor._id,
          name: visitor.name,
          email: visitor.email
        });
      } catch (err) {
        results.failed.push({
          row: i + 2,
          name: visitorsData[i].name || 'Unknown',
          error: err.message
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Imported ${results.created.length} visitors${results.failed.length > 0 ? `, ${results.failed.length} failed` : ''}`,
      data: results
    });
  } catch (err) {
    next(err);
  }
};
