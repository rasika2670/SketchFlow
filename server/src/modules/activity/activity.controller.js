const activityService = require('./activity.service');

/**
 * Get paginated activity logs for a board
 * GET /api/boards/:boardId/activities
 */
const getActivities = async (req, res) => {
  const { boardId } = req.params;
  const { cursor_created_at, cursor_id, limit } = req.query;

  const activities = await activityService.getByBoardId(boardId, {
    cursor_created_at,
    cursor_id,
    limit: limit ? parseInt(limit, 10) : 50
  });

  res.status(200).json({
    success: true,
    data: activities,
    meta: { timestamp: new Date().toISOString() }
  });
};

module.exports = {
  getActivities
};
