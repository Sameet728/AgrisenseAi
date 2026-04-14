const SensorHistory = require('../models/SensorHistory');

const getHistory = async (req, res, next) => {
  try {
    const { range, startDate, endDate } = req.query;
    let query = { userId: req.user._id };

    const now = new Date();

    // Abstract the date parsing logic to securely construct Mongoose boundaries
    if (range) {
      if (range === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        query.timestamp = { $gte: d };
      } else if (range === 'month') {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        query.timestamp = { $gte: d };
      } else if (range === 'year') {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        query.timestamp = { $gte: d };
      }
      // 'all' passes straight through without a bounded timestamp.
    } else if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Protect against overwhelming payload sizes on dense custom queries
    // Returning 1000 items is usually enough for a line chart aggregation.
    const historyData = await SensorHistory.find(query)
      .sort({ timestamp: 1 })
      .limit(15000)
      .lean();

    res.json({
      success: true,
      count: historyData.length,
      data: historyData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getHistory };
